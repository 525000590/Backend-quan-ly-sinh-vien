# Prompt Log - Buổi 06: Middlewares & Validation

## 1. Bối cảnh dự án
- **Dự án**: `backend-quan-ly-sinh-vien` (Node.js, Express 5, TypeScript ESM/NodeNext, Sequelize 6, SQL Server).
- **Mục tiêu**: Nâng cấp hệ thống với Validation Middleware bằng Zod, ghi log hệ thống bằng Morgan (`access.log` chế độ append), cập nhật tài liệu OpenAPI 3.0.3 YAML và kiểm thử tự động 12 test case Validation (V01–V12) cùng 12 test case hồi quy (T01–T12).

---

## 2. Nhật ký Prompt theo khung CTCO (Context - Task - Constraint - Output)

### Prompt 0: Khảo sát cấu trúc dự án
- **Context**: Tiếp tục dự án Quản lý sinh viên từ Chương 04 bằng Express, TypeScript, pnpm; đã có CRUD và OpenAPI YAML.
- **Task**: Đọc `package.json`, `tsconfig.json`, `server.ts`, `sinhVien.routes.ts`, `sinhVien.controller.ts`, `sinhVien.service.ts` và `openapi.yaml`. Xác định luồng dữ liệu của request.
- **Constraint**: Không tạo project mới, không đổi file tùy tiện, không lộ thông tin bảo mật từ `.env`.
- **Output**: Bảng phân vai các file, vị trí tích hợp Zod và Morgan, nhận diện rủi ro tiềm ẩn.
- **Kết quả review**: Xác định chính xác vị trí chèn middleware trước controller trong Route và trước route trong Express app.

### Prompt 1: Tìm hiểu luồng Middleware trong Express
- **Context**: API `GET /api/v1/sinh-vien` đang hoạt động ổn định trên Express TypeScript.
- **Task**: Giải thích vai trò của `req`, `res`, `next()` và thứ tự `app.use` -> `router` -> `controller` qua một request thực tế.
- **Constraint**: Minh họa logic, không làm thay đổi dữ liệu hay API; làm rõ tình huống gọi `next()` và không gọi `next()`.
- **Output**: Sơ đồ luồng xử lý, ví dụ minh họa và câu hỏi kiểm tra.
- **Ghi chú**: Middleware là trạm kiểm soát trung gian. Nếu dữ liệu không hợp lệ, middleware gọi `res.status(400).json(...)` và `return` ngay (short-circuit), ngăn không cho request tiếp tục vào Controller.

### Prompt 2: Xây dựng Zod Schema (POST và PUT)
- **Context**: Dự án `backend-quan-ly-sinh-vien` có model CSDL: `maSV VARCHAR(5)`, `hoTen NVARCHAR(150)`, `email NVARCHAR(254)`, `maLop NVARCHAR(50)`.
- **Task**: Tạo file `src/validations/sinhVien.schema.ts` định nghĩa `createSinhVienSchema` và `updateSinhVienSchema`.
- **Constraint**:
  - `POST`: Bắt buộc 4 trường `maSV`, `hoTen`, `email`, `maLop`.
  - `PUT`: Chỉ nhận `hoTen`, `email`, `maLop` (không cho phép đổi `maSV` qua body).
  - Tự động `trim()` chuỗi, cấm chuỗi rỗng (`min(1)`), kiểm tra format email.
  - Sử dụng `.strict()` để chặn đứng mọi thuộc tính lạ ngoài hợp đồng (ví dụ: `role: "admin"`).
  - Đối chiếu ràng buộc độ dài khớp với CSDL (`max(150)`, `max(254)`, `max(50)`, `max(5)`).
- **Output**: File `src/validations/sinhVien.schema.ts` hoàn chỉnh.

### Prompt 3: Viết Validation Middleware dùng chung
- **Context**: Đã có Zod Schema cho Sinh Viên và chuẩn Response lỗi của dự án.
- **Task**: Tạo `src/middlewares/validate.middleware.ts` nhận vào `schema: z.ZodType` và trả về `RequestHandler`.
- **Constraint**:
  - Dùng `schema.safeParse(req.body)` để tránh exception làm crash ứng dụng.
  - Khi hợp lệ: gán `req.body = parsed.data` (dữ liệu đã chuẩn hóa) rồi gọi `next()`.
  - Khi không hợp lệ: trả về HTTP 400 với cấu trúc `{ success: false, message: 'Dữ liệu đầu vào không hợp lệ', data: null, errors: [...] }` và `return` ngay.
- **Output**: File `src/middlewares/validate.middleware.ts`.

### Prompt 4: Tích hợp Middleware vào Route POST và PUT
- **Context**: File `src/routes/sinhVien.routes.ts` đang xử lý 5 endpoint CRUD.
- **Task**: Chèn `validate(createSinhVienSchema)` vào `router.post('/')` và `validate(updateSinhVienSchema)` vào `router.put('/:maSV')`.
- **Constraint**: Giữ nguyên các route `GET`, `DELETE` và các handler hiện có.
- **Output**: File `src/routes/sinhVien.routes.ts` đã được cập nhật.

### Prompt 5: Cấu hình Morgan Logging và cập nhật OpenAPI YAML
- **Context**: Dự án có Express app tại `src/server.ts` và đặc tả tại `docs/openapi.yaml`.
- **Task**:
  - Tạo `src/middlewares/access-log.middleware.ts` ghi log bằng `morgan('combined')` vào `logs/access.log` với chế độ append (`flags: 'a'`).
  - Gắn `accessLogger` vào `src/server.ts` trước các router.
  - Cập nhật `docs/openapi.yaml` bổ sung schema `ValidationIssue` và trường `errors` trong `ErrorResponse`.
- **Constraint**: Không ghi mật khẩu hay token vào log; không tạo file openapi mới; chỉ có duy nhất 1 `components` và 1 `schemas`.
- **Output**: Cập nhật `src/server.ts`, `docs/openapi.yaml`, `.gitignore`.

---

## 3. Bài tập bắt buộc & Phân tích chuyên sâu

### Bài tập bắt buộc A — Mở rộng Validation:
1. **Đối chiếu độ dài Model/Database**:
   - `dbo.SinhVien`:
     - `maSV`: `VARCHAR(5)` -> Zod rule: `.min(1).max(5)`
     - `hoTen`: `NVARCHAR(150)` -> Zod rule: `.min(1).max(150)`
     - `email`: `NVARCHAR(254)` -> Zod rule: `.email().max(254)`
     - `maLop`: `NVARCHAR(50)` -> Zod rule: `.min(1).max(50)`
2. **Tại sao lỗi trùng `maSV` vẫn cần kiểm tra ở tầng dữ liệu/nghiệp vụ?**
   - Zod Validation chỉ thực thi kiểm tra tĩnh (stateless syntax validation) trên nội dung payload của Request mà Client gửi lên (kiểu chuỗi, độ dài, định dạng regex).
   - Zod không thể biết mã `maSV` đó đã tồn tại trong CSDL hay chưa vì nó không truy vấn database.
   - Việc kiểm tra trùng mã đòi hỏi truy vấn trạng thái CSDL (`findByPk`) và phải được tầng CSDL bảo vệ bằng `PRIMARY KEY` (ràng buộc toàn vẹn dữ liệu) để xử lý các xung đột đồng thời (race condition / concurrency).

### Bài tập bắt buộc B — Nhật ký Request (Morgan):
1. **Chế độ append (`flags: 'a'`)**:
   - Sử dụng `fs.createWriteStream(logFile, { flags: 'a' })` đảm bảo mỗi khi server restart, các dòng log mới tiếp tục được ghi nối vào cuối file `logs/access.log` thay vì xóa trắng (`flags: 'w'`).
2. **Bảo mật Logging**:
   - Không được ghi mật khẩu, JWT token hay thông tin nhạy cảm vào log vì file log thường được lưu trữ trên server hoặc chuyển tiếp sang các dịch vụ giám sát bên thứ ba (ELK, CloudWatch, Datadog). Nếu lộ mật khẩu trong log, nguy cơ rò rỉ dữ liệu sẽ rất nghiêm trọng.

---

## 4. Phân tích Logic kiểm tra quyền (Bước chuẩn bị cho Buổi 07)

### Bảng phân biệt HTTP 401 và 403:
| Tình huống | Mã HTTP | Ý nghĩa | Xử lý |
|---|:---:|---|---|
| Request không có hoặc token không hợp lệ / hết hạn | **401 Unauthorized** | Chưa xác thực được danh tính người dùng | Yêu cầu đăng nhập |
| Người dùng đã xác thực (ví dụ role `student`) nhưng gọi API chỉ dành cho `admin` | **403 Forbidden** | Đã biết danh tính nhưng không đủ quyền hạn | Từ chối truy cập |

### Pseudocode Authorize Middleware:
```typescript
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user được gán từ Auth Middleware xác thực JWT ở bước trước
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực danh tính' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next(); // Hợp lệ: tiếp tục vào Controller
  };
};
```

---

## 5. Câu hỏi vấn đáp của giảng viên

1. **Middleware nằm trước hay sau Controller?**
   - Middleware nằm **trước** Controller. Nó đóng vai trò người gác cổng, thực hiện tiền xử lý (parse body, ghi log, xác thực, validate dữ liệu). Chỉ khi middleware gọi `next()` thì Controller mới được thực thi.
2. **`safeParse` khác `parse` ở điểm nào?**
   - `parse()`: Nếu dữ liệu sai, nó sẽ trực tiếp ném ra (throw) một ngoại lệ `ZodError`. Nếu không bắt bằng `try/catch`, server sẽ nhảy vào error handler hoặc crash.
   - `safeParse()`: Không bao giờ throw lỗi. Nó trả về một đối tượng `{ success: true, data }` hoặc `{ success: false, error }`, giúp code xử lý rẽ nhánh an toàn và trả mã lỗi HTTP 400 tùy biến mượt mà.
3. **Khi nào trả các mã HTTP 400, 401, 403, 404, 409?**
   - `400 Bad Request`: Client gửi payload sai cấu trúc, thiếu trường, sai kiểu dữ liệu (Validation thất bại).
   - `401 Unauthorized`: Client chưa cung cấp thông tin xác thực danh tính (chưa đăng nhập hoặc token sai).
   - `403 Forbidden`: Client đã xác thực nhưng không có quyền hạn truy cập tài nguyên.
   - `404 Not Found`: Không tìm thấy tài nguyên (đường dẫn URL không tồn tại hoặc ID sinh viên không có).
   - `409 Conflict`: Xung đột dữ liệu (ví dụ mã sinh viên đã tồn tại).
4. **Vì sao YAML không thay thế cho Zod?**
   - OpenAPI YAML chỉ là tài liệu đặc tả (Documentation/Contract) nhằm mô tả giao diện API cho con người hoặc công cụ đọc. Nó **không tự động thực thi** kiểm tra dữ liệu ở runtime của ứng dụng Node.js.
   - Zod là thư viện validation chạy ở **runtime**, trực tiếp chặn đứng các request sai trước khi chúng tới Controller/Database.
5. **Làm sao biết Validation không phá API cũ?**
   - Thực hiện kiểm thử hồi quy (Regression Testing): Chạy lại toàn bộ 12 test case T01–T12 của Buổi 05. Nếu tất cả đều tiếp tục hoạt động đúng với status và dữ liệu kỳ vọng, API cũ được bảo đảm tính tương thích.
6. **CTCO giúp AI không viết sai project như thế nào?**
   - Bằng cách phân định rõ: **Context** (nền tảng công nghệ, file đang có), **Task** (việc cụ thể cần làm), **Constraint** (giới hạn bắt buộc, không tạo mới, không đổi kiến trúc) và **Output** (kết quả mong muốn cụ thể), AI sẽ tập trung giải quyết đúng vấn đề và không tự ý thay đổi kiến trúc hoặc sinh mã lạc đề.
7. **Giải thích ngắn (5–7 câu) về Middleware, `next()`, Zod Validation và Morgan:**
   - Trong Express, Middleware là các hàm trung gian nằm giữa luồng nhận Request từ Client và gửi Response về Controller.
   - Hàm `next()` giữ vai trò điều phối, báo hiệu cho Express chuyển quyền kiểm soát sang middleware hoặc handler tiếp theo trong chuỗi.
   - Nếu middleware phát hiện điều kiện không hợp lệ, nó có thể ngắt luồng (short-circuit) và phản hồi ngay mà không gọi `next()`.
   - Zod Validation đóng vai trò kiểm tra cấu trúc dữ liệu đầu vào theo Schema định sẵn, loại bỏ trường thừa và chuẩn hóa chuỗi dữ liệu trước khi đến Controller.
   - Morgan là middleware chuyên dụng để ghi log chi tiết các HTTP request vào console hoặc file `access.log` ở chế độ append, hỗ trợ giám sát và truy vết hệ thống hiệu quả.

---

# Prompt Log - Buổi 07: Authentication & Authorization (JWT & RBAC)

## 1. Bối cảnh dự án
- **Dự án**: `backend-quan-ly-sinh-vien` (Node.js, Express 5, TypeScript ESM/NodeNext, Sequelize 6, SQL Server, Zod 4).
- **Mục tiêu**: Xây dựng hệ thống Xác thực (Authentication) và Phân quyền (Authorization) hoàn chỉnh theo mô hình stateless JWT và RBAC (Role-Based Access Control).
- **Phạm vi bảo vệ**:
  - Public: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/v1/sinh-vien`, `GET /api/v1/sinh-vien/:maSV`.
  - Yêu cầu xác thực (`isAuth`): `GET /api/auth/profile`.
  - Yêu cầu quản trị (`isAuth` + `isAdmin`): `POST /api/v1/sinh-vien`, `PUT /api/v1/sinh-vien/:maSV`, `DELETE /api/v1/sinh-vien/:maSV`.

---

## 2. Nhật ký Prompt theo khung CTCO (Context - Task - Constraint - Output)

### Prompt 0: Khảo sát cấu trúc & chuẩn bị schema Users
- **Context**: Tiếp tục dự án Quản lý sinh viên sau Buổi 06. Đã có bảng `SinhVien`, `Lop` và middleware `validate`, `accessLogger`.
- **Task**: Thiết kế bảng `dbo.Users` trên SQL Server với các trường: `id INT IDENTITY PK`, `fullName NVARCHAR(150)`, `email NVARCHAR(254) UNIQUE`, `passwordHash VARCHAR(255)`, `role VARCHAR(20) DEFAULT 'student' CHECK ('admin', 'student')`.
- **Constraint**: Không làm ảnh hưởng đến dữ liệu sinh viên hiện có; cấp đầy đủ quyền SELECT, INSERT, UPDATE, DELETE cho user `sv_app`.
- **Output**: Script `sql/05-users-auth.sql`.

### Prompt 1: Nghiên cứu cơ chế Authentication & Authorization
- **Context**: Ứng dụng xây dựng API RESTful cho client tách rời (Postman, SPA, Mobile).
- **Task**: So sánh Session-based vs Token-based (JWT); Symmetric (HMAC SHA256) vs Asymmetric (RSA/ECDSA).
- **Constraint**: Lựa chọn giải pháp phù hợp với kiến trúc RESTful stateless.
- **Output**: Lựa chọn HMAC-SHA256 (HS256) với secret key an toàn `JWT_SECRET` lưu trong `.env`, token thời hạn 1 giờ (`1h`).

### Prompt 2: Tạo Model User trong Sequelize
- **Context**: Dự án sử dụng Sequelize 6 kết nối SQL Server qua cấu hình TypeScript.
- **Task**: Định nghĩa model `User` trong `src/models/user.model.ts` và export từ `src/models/index.ts`.
- **Constraint**: Không bật `sync({ force: true })` để tránh mất dữ liệu; khai báo đúng kiểu TypeScript cho thuộc tính.
- **Output**: File `src/models/user.model.ts` khớp bảng `dbo.Users`.

### Prompt 3: Cài đặt thư viện bảo mật và helper JWT
- **Context**: Cần mã hóa mật khẩu và ký phát hành JWT.
- **Task**: Cài đặt `bcrypt`, `jsonwebtoken` cùng `@types/bcrypt`, `@types/jsonwebtoken`; tạo module `src/utils/jwt.ts` (`generateToken`, `verifyToken`).
- **Constraint**: Dùng bcrypt salt rounds = 12; JWT ký bằng HS256, thời hạn 1 giờ; xử lý an toàn khi token sai hoặc hết hạn.
- **Output**: File `src/utils/jwt.ts` và mở rộng type `src/types/express.d.ts` cho `req.user`.

### Prompt 4: Xây dựng Zod Schema cho Auth
- **Context**: Endpoint đăng ký và đăng nhập cần kiểm soát chặt chẽ payload đầu vào.
- **Task**: Tạo `src/validations/auth.schema.ts` với `registerSchema` và `loginSchema`.
- **Constraint**:
  - `registerSchema`: `fullName` min 1 max 150; `email` định dạng chuẩn; `password` min 6 ký tự. Cấm thuộc tính lạ bằng `.strict()` để chặn leo thang đặc quyền (`role: "admin"`).
  - `loginSchema`: `email` và `password` bắt buộc.
- **Output**: `src/validations/auth.schema.ts`.

### Prompt 5: Cài đặt Service và Controller Auth
- **Context**: Xử lý logic nghiệp vụ đăng ký, đăng nhập và lấy profile.
- **Task**: Viết `src/services/auth.service.ts` và `src/controllers/auth.controller.ts`.
- **Constraint**:
  - Khi đăng ký: hash mật khẩu với cost 12, luôn gán `role = 'student'`, không trả về `passwordHash` trong response.
  - Khi đăng nhập: kiểm tra email và compare bcrypt. Nếu sai trả mã lỗi `401 Unauthorized` với thông điệp chung `Email hoặc mật khẩu không chính xác` (chống User Enumeration).
- **Output**: `src/services/auth.service.ts` và `src/controllers/auth.controller.ts`.

### Prompt 6: Cài đặt Middleware isAuth
- **Context**: Bảo vệ các endpoint yêu cầu xác thực người dùng.
- **Task**: Tạo `src/middlewares/isAuth.ts`.
- **Constraint**:
  - Đọc header `Authorization: Bearer <token>`.
  - Thiếu header hoặc sai định dạng: trả HTTP `401 Unauthorized`.
  - Verify token thất bại hoặc token hết hạn: trả HTTP `401 Unauthorized`.
  - Hợp lệ: gán thông tin payload vào `req.user` và gọi `next()`.
- **Output**: `src/middlewares/isAuth.ts`.

### Prompt 7: Cài đặt Endpoint GET /api/auth/profile
- **Context**: Người dùng đã đăng nhập muốn xem thông tin tài khoản của mình.
- **Task**: Đăng ký route `GET /api/auth/profile` được bảo vệ bởi `isAuth`.
- **Constraint**: Tìm người dùng theo `req.user.id`, loại trừ trường `passwordHash`, trả HTTP `200 OK`.
- **Output**: Endpoint hoàn chỉnh trong `src/routes/auth.routes.ts`.

### Prompt 8: Cài đặt Middleware isAdmin (Phân quyền RBAC)
- **Context**: Một số thao tác nhạy cảm chỉ cho phép vai trò Quản trị viên.
- **Task**: Tạo `src/middlewares/isAdmin.ts`.
- **Constraint**:
  - Kiểm tra `req.user`. Nếu không tồn tại: trả HTTP `401 Unauthorized`.
  - Nếu `req.user.role !== 'admin'`: trả HTTP `403 Forbidden` với thông điệp `Chỉ quản trị viên mới có quyền thực hiện thao tác này`.
  - Nếu `req.user.role === 'admin'`: gọi `next()`.
- **Output**: `src/middlewares/isAdmin.ts`.

### Prompt 9: Bảo vệ Route Quản lý Sinh viên
- **Context**: Các API thêm, sửa, xóa sinh viên hiện đang là public.
- **Task**: Gắn `isAuth` và `isAdmin` vào `POST /api/v1/sinh-vien`, `PUT /api/v1/sinh-vien/:maSV`, `DELETE /api/v1/sinh-vien/:maSV`.
- **Constraint**:
  - Giữ nguyên các route `GET` ở trạng thái Public (không cần token).
  - Thứ tự middleware trên route nhạy cảm: `isAuth` -> `isAdmin` -> `validate(...)` -> `controller`.
- **Output**: `src/routes/sinhVien.routes.ts`.

### Prompt 10: Seed tài khoản Admin ban đầu
- **Context**: Cần tài khoản admin để phục vụ kiểm thử và vận hành hệ thống.
- **Task**: Viết script `src/scripts/seed-admin.ts` kiểm tra tài khoản `admin@example.com`, nếu chưa có thì tạo mới với mật khẩu mã hóa `Admin@123` và vai trò `admin`.
- **Constraint**: Idempotent (chạy nhiều lần không gây lỗi trùng dữ liệu).
- **Output**: Script `src/scripts/seed-admin.ts` và lệnh `pnpm seed:admin`.

### Prompt 11: Cập nhật tài liệu OpenAPI 3.0.3 YAML
- **Context**: File `docs/openapi.yaml` cần phản ánh chính xác cơ chế bảo mật mới.
- **Task**: Bổ sung `securitySchemes` BearerAuth (HTTP Bearer JWT), thêm endpoints `/api/auth/*`, thêm `security` và mã lỗi `401`, `403` vào các API sinh viên được bảo vệ.
- **Constraint**: OpenAPI 3.0.3 chuẩn mực, không lặp khóa `components`.
- **Output**: `docs/openapi.yaml`.

---

## 3. Đánh giá An ninh & Thiết kế Bảo mật (Security Review)

1. **Lưu trữ mật khẩu an toàn với Bcrypt**:
   - Mật khẩu người dùng tuyệt đối không bao giờ được lưu trữ dưới dạng bản rõ (plaintext).
   - Áp dụng thuật toán băm chậm Bcrypt với hệ số chi phí (work factor / cost) là 12 (`saltRounds = 12`).
   - Muối ngẫu nhiên (salt) được sinh độc lập cho từng mật khẩu, vô hiệu hóa hoàn toàn hình thức tấn công bằng bảng cầu vồng (Rainbow Table).
2. **Cơ chế Token Stateless JWT**:
   - JWT mang thông tin danh tính dạng tự chứa (self-contained), server không cần truy vấn bảng Session trong CSDL ở mỗi request, giúp hệ thống mở rộng quy mô (scalable).
   - Secret key được lưu độc quyền trong biến môi trường `.env`, không bao giờ commit vào kho mã nguồn Git.
   - Thời gian sống của Access Token được giới hạn nghiêm ngặt ở mức 1 giờ (`expiresIn: '1h'`) để hạn chế rủi ro nếu token bị lộ.
3. **Phân quyền theo vai trò (RBAC) & Nguyên tắc đặc quyền tối thiểu**:
   - Phân định rõ rệt vai trò: `student` (chỉ xem thông tin, không thể sửa/xóa) và `admin` (toàn quyền quản trị).
   - Mọi tài khoản mới đăng ký qua endpoint công khai luôn bị ép buộc vai trò `student`.
4. **Chống tấn công dò quét tài khoản (Anti-User Enumeration)**:
   - Tại endpoint đăng nhập `POST /api/auth/login`, dù tài khoản không tồn tại hay mật khẩu bị nhập sai, hệ thống luôn trả về cùng một mã HTTP `401 Unauthorized` với thông điệp: `"Email hoặc mật khẩu không chính xác"`.
   - Không thông báo chi tiết "Email không tồn tại" hay "Sai mật khẩu" nhằm ngăn kẻ tấn công phát hiện danh sách email hợp lệ trong hệ thống.
5. **Chống tấn công leo thang đặc quyền (Anti-Privilege Escalation)**:
   - Schema Zod `registerSchema` cấu hình `.strict()`, lập tức từ chối và trả về HTTP `400 Bad Request` nếu client cố tình truyền thêm trường `role: "admin"`.
   - Tại tầng Service, giá trị `role` luôn được gán cứng là `'student'`, hoàn toàn bỏ qua mọi can thiệp từ payload bên ngoài.

---

## 4. Bộ câu hỏi vấn đáp bảo vệ đồ án (Oral Defense Questions)

1. **Phân biệt Authentication (Xác thực) và Authorization (Phân quyền)?**
   - **Authentication (Xác thực)**: Trả lời cho câu hỏi *"Bạn là ai?"*. Đây là quá trình chứng minh danh tính người dùng (thông qua email, mật khẩu, JWT token hợp lệ). Mã lỗi khi thất bại là `401 Unauthorized`.
   - **Authorization (Phân quyền)**: Trả lời cho câu hỏi *"Bạn có quyền làm gì?"*. Đây là quá trình kiểm tra xem người dùng đã được xác thực có đủ thẩm quyền để truy cập tài nguyên hoặc thực hiện hành động cụ thể hay không (ví dụ: chỉ role `admin` mới được thêm/xóa sinh viên). Mã lỗi khi thất bại là `403 Forbidden`.

2. **Tại sao phải hash mật khẩu bằng bcrypt thay vì MD5/SHA256 hay lưu plaintext?**
   - Plaintext cực kỳ nguy hiểm vì nếu cơ sở dữ liệu bị lộ, toàn bộ mật khẩu người dùng bị chiếm đoạt ngay lập tức.
   - MD5 và SHA256 là các hàm băm đa năng được thiết kế để chạy cực nhanh. Kẻ tấn công có thể dùng phần cứng hiện đại (GPU, ASIC) tính toán hàng tỷ hash mỗi giây để tấn công brute-force hoặc tra cứu qua Rainbow Table.
   - Bcrypt là hàm băm chậm chuyên dụng cho mật khẩu, tích hợp cơ chế sinh Salt ngẫu nhiên và cho phép điều chỉnh hệ số chi phí (work factor). Với cost 12, mỗi lần hash mất khoảng 200–300ms trên CPU, làm cho việc tấn công brute-force trở nên bất khả thi về mặt thời gian và tài nguyên tính toán.

3. **Cấu trúc của JWT gồm những phần nào?**
   - Gồm 3 phần phân tách bởi dấu chấm (`.`): `Header.Payload.Signature`.
     - **Header**: Chứa kiểu token (`typ: "JWT"`) và thuật toán ký (ví dụ: `alg: "HS256"`).
     - **Payload**: Chứa các claim (thông tin người dùng như `id`, `email`, `role`, và thời hạn `iat`, `exp`). Payload chỉ được mã hóa Base64URL nên không phải là bí mật.
     - **Signature**: Chữ ký số được tính bằng công thức: `HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secretKey)`. Chữ ký đảm bảo token không bị kẻ gian sửa đổi trái phép trên đường truyền.

4. **JWT lưu ở đâu trên client và có rủi ro gì?**
   - Client thường lưu JWT trong `LocalStorage` hoặc `HttpOnly Cookie`.
   - **LocalStorage**: Dễ triển khai trên SPA/Mobile, nhưng có rủi ro bị tấn công XSS (Cross-Site Scripting) đọc trộm token nếu ứng dụng có lỗ hổng chèn mã độc JavaScript.
   - **HttpOnly Cookie**: Bảo vệ chống XSS hiệu quả (JavaScript không thể đọc được cookie), nhưng lại dễ đối mặt với tấn công CSRF (Cross-Site Request Forgery) nếu không có cờ `SameSite` và token CSRF bảo vệ.

5. **Tại sao không lưu mật khẩu hay thông tin nhạy cảm vào JWT payload?**
   - Payload của JWT chỉ được mã hóa dạng **Base64URL**, hoàn toàn **không được mã hóa bí mật (encryption)**.
   - Bất kỳ ai chặn bắt được token hoặc xem trong trình duyệt đều có thể giải mã payload thành JSON trong tích tắc bằng lệnh `atob()` hoặc trên website `jwt.io`. Do đó, chỉ lưu các thông tin công khai không nhạy cảm (ID, role, email) và tuyệt đối cấm lưu mật khẩu hay số căn cước/thẻ ngân hàng.

6. **Thứ tự middleware `isAuth` và `isAdmin` có thể đảo ngược được không? Vì sao?**
   - **Tuyệt đối không thể đảo ngược.**
   - Vì middleware `isAdmin` kiểm tra quyền dựa vào thuộc tính `req.user.role`. Mà thuộc tính `req.user` này chỉ được trích xuất và gắn vào request sau khi middleware `isAuth` giải mã và xác thực token JWT thành công.
   - Nếu đảo `isAdmin` lên trước, `req.user` sẽ là `undefined` và request sẽ lập tức bị chặn với lỗi `401 Unauthorized` ngay cả khi client gửi token admin hợp lệ.

7. **Làm thế nào để thu hồi (revoke) một JWT token trước khi nó hết hạn?**
   - Vì JWT vốn là stateless (server không kiểm tra database khi xác thực token hợp lệ), việc thu hồi token ngay lập tức đòi hỏi một trong các giải pháp kết hợp sau:
     1. **Blacklist / Blocklist Token**: Lưu các token đã logout hoặc bị nghi ngờ vào bộ nhớ đệm tốc độ cao (như Redis) kèm thời gian sống bằng với `exp` của token. Middleware `isAuth` sẽ kiểm tra thêm xem token có trong blacklist không.
     2. **Token Version / Timestamp**: Lưu một trường `tokenVersion` trong bảng `Users`. Khi người dùng đổi mật khẩu hoặc đăng xuất toàn bộ thiết bị, ta tăng `tokenVersion`. Token JWT kèm theo `tokenVersion` cũ sẽ bị từ chối.
     3. **Mô hình Access Token ngắn + Refresh Token**: Giữ Access Token có hạn sử dụng rất ngắn (ví dụ: 5–15 phút), khi cần thu hồi ta hủy Refresh Token trong cơ sở dữ liệu.

8. **Giải thích nguyên tắc "Least Privilege" và cách áp dụng trong dự án này?**
   - **Nguyên tắc Đặc quyền tối thiểu (Principle of Least Privilege)**: Người dùng hoặc tiến trình chỉ được cấp đúng và đủ quyền hạn tối thiểu cần thiết để hoàn thành công việc của họ, không cấp dư thừa bất kỳ đặc quyền nào.
   - **Áp dụng trong dự án**:
     - Người dùng thông thường (role `student`) chỉ được cấp quyền đọc danh sách sinh viên (`GET /api/v1/sinh-vien`) và xem hồ sơ cá nhân của chính mình (`GET /api/auth/profile`).
     - Quyền chỉnh sửa và thay đổi cấu trúc dữ liệu (`POST`, `PUT`, `DELETE` sinh viên) chỉ được cấp độc quyền cho người dùng có vai trò `admin`.
     - Tài khoản database `sv_app` chỉ được cấp quyền trên các bảng cần thiết, không có quyền quản trị cấp máy chủ (`sysadmin`).
