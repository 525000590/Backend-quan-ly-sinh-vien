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


---

# Prompt Log - Buổi 08: Upload Hình Ảnh & Kết Nối Frontend - Backend (Chương 07)

## 1. Bối cảnh dự án
- **Dự án**: `backend-quan-ly-sinh-vien` (Node.js, Express 5, TypeScript ESM/NodeNext, Sequelize 6, SQL Server, JWT, Zod, Multer) + Frontend độc lập trong thư mục `frontend/` (Vite, React 19, TypeScript, Axios).
- **Mục tiêu**:
  - Xây dựng tính năng upload Avatar an toàn cho người dùng đang đăng nhập bằng Multer (giới hạn dung lượng <= 2MB, kiểm tra chữ ký/magic bytes file thực tế chống giả mạo, phục vụ tĩnh qua `express.static`).
  - Cấu hình CORS chặt chẽ theo danh sách Origin của Frontend (`http://localhost:5173`).
  - Xây dựng ứng dụng Frontend React hoàn chỉnh kết nối trực tiếp với Backend API: Đăng nhập nhận JWT trong bộ nhớ, hiển thị bảng sinh viên (Loading, Empty, Error, Retry), phân quyền Admin hiển thị nút Xóa (hỏi xác nhận trước khi gọi DELETE), và Component upload Avatar bằng FormData kèm xem trước ảnh.

---

## 2. Nhật ký Prompt theo khung CTCO (Context - Task - Constraint - Output)

### Prompt 0: Khảo sát dự án và chốt trạng thái ban đầu
- **Context**: Tiếp tục đúng `backend-quan-ly-sinh-vien` sau Chương 06 (đã có CRUD SinhVien, Login, Register, Profile, RBAC, Swagger YAML).
- **Task**: Kiểm tra trạng thái build `pnpm build`, kiểm tra bảng `dbo.Users` và xác định vị trí tích hợp upload Avatar và CORS.
- **Constraint**: Chưa viết code mới; không tạo Backend thứ hai; không sửa đổi file khi chưa kiểm chứng; không đưa secret vào git.
- **Output**: Bảng phân công file: bổ sung cột `avatarUrl` trong `dbo.Users`, middleware `upload.middleware.ts`, cấu hình CORS và static file trong `server.ts`, mở rộng `openapi.yaml`.

### Prompt 1: Bổ sung avatarUrl an toàn trong SQL Server & Model
- **Context**: Dự án đã có bảng `dbo.Users` với các trường `id`, `fullName`, `email`, `passwordHash`, `role`.
- **Task**: Tạo script vá `sql/05-add-avatar-url.sql` bổ sung cột `avatarUrl NVARCHAR(255) NULL` và ánh xạ vào model Sequelize `User`.
- **Constraint**: Không `DROP` bảng, không dùng `sync({ force: true })` hay `sync({ alter: true })`, không làm mất các User hiện có, script phải chạy được nhiều lần (idempotent).
- **Output**: File `sql/05-add-avatar-url.sql` và cập nhật `src/models/user.model.ts`.

### Prompt 2: Cấu hình Multer: Chỉ nhận ảnh hợp lệ <= 2MB & kiểm tra chữ ký file thực
- **Context**: Cần nhận file ảnh gửi qua `multipart/form-data` ở Express TypeScript.
- **Task**: Tạo middleware `src/middlewares/upload.middleware.ts` lưu file vào `public/uploads/`, giới hạn 2MB (2.097.152 bytes), sinh tên file duy nhất bằng `crypto.randomUUID()`, kiểm tra magic bytes thực tế để từ chối file văn bản đổi tên thành `.png`.
- **Constraint**: Field name bắt buộc là `avatar`; khi vượt quá 2MB phải trả HTTP 413 (`LIMIT_FILE_SIZE`); dọn sạch file rác nếu kiểm tra nội dung thất bại; không để lộ thư mục upload ra ngoài tầm kiểm soát.
- **Output**: File `src/middlewares/upload.middleware.ts` và tích hợp bắt `MulterError` trong `src/middlewares/error.middleware.ts`.

### Prompt 3: Tạo POST /api/auth/me/avatar và cập nhật đúng User
- **Context**: Đã có `isAuth` trích xuất danh tính người dùng vào `req.user`.
- **Task**: Tạo route `POST /api/auth/me/avatar` với thứ tự `isAuth` -> `upload.single('avatar')` -> `uploadAvatarController`.
- **Constraint**: Lấy ID người dùng từ `req.user.sub` (tuyệt đối không tin `req.body.userId`); đường dẫn lưu trong DB là URL tương đối `/uploads/<filename>`; dọn file mới nếu cập nhật DB thất bại.
- **Output**: Controller `uploadAvatarController`, Service `updateUserAvatar`, Route trong `src/routes/auth.routes.ts`, và `app.use('/uploads', express.static('public/uploads'))` trong `src/server.ts`.

### Prompt 4: Lập bộ kiểm thử Upload (U01 – U12)
- **Context**: Endpoint upload Avatar cần được kiểm chứng nghiêm ngặt.
- **Task**: Viết kịch bản kiểm thử tự động `src/scripts/test-buoi8-upload.ts` và tạo Postman collection `postman/Buoi8-Upload-Frontend.postman_collection.json`.
- **Constraint**: Không tạo token giả; kiểm tra đủ 12 trường hợp từ U01 đến U12; xác nhận không để lại file rác trên đĩa khi gặp lỗi.
- **Output**: Bộ test U01–U12 chạy đạt 100% (12/12 ca PASS).

### Prompt 5: Swagger YAML và công khai ảnh tĩnh đúng mức
- **Context**: Tài liệu `docs/openapi.yaml` cần mô tả đầy đủ API mới.
- **Task**: Bổ sung endpoint `POST /api/auth/me/avatar` nhận `multipart/form-data`, yêu cầu `bearerAuth`, các mã phản hồi 200, 400, 401, 413, 500, và bổ sung `avatarUrl` vào schema `User`.
- **Constraint**: Chuẩn OpenAPI 3.0.3, không trùng lặp các component hiện có.
- **Output**: `docs/openapi.yaml` đã cập nhật.

### Prompt 6: Khởi tạo Frontend Vite + React và thiết lập CORS
- **Context**: Backend chạy tại `http://localhost:5000`; Frontend dự kiến chạy tại `http://localhost:5173`.
- **Task**: Khởi tạo ứng dụng trong `frontend/` bằng Vite + React + TypeScript; cài đặt Axios; cấu hình CORS trong Backend chỉ cho phép Origin của Vite.
- **Constraint**: Không mở wildcard `origin: '*'`; không hardcode URL mà dùng `VITE_API_BASE_URL` trong file `.env`.
- **Output**: Dự án `frontend/`, client Axios `frontend/src/api/client.ts`, cấu hình CORS trong `src/server.ts`.

### Prompt 7: Hiển thị danh sách SinhVien bằng Axios GET
- **Context**: Backend cung cấp `GET /api/v1/sinh-vien` trả về `{ success, message, data: [...] }`.
- **Task**: Viết component `SinhVienTable.tsx` gọi API qua Axios; hiển thị bảng 4 cột (`maSV`, `hoTen`, `email`, `maLop`); xử lý các trạng thái Loading, Empty, Error kèm nút Thử lại.
- **Constraint**: Đọc mảng chính xác tại `response.data.data`; không giả định `response.data` là mảng; tránh lỗi setState sau khi unmount.
- **Output**: File `frontend/src/components/SinhVienTable.tsx`.

### Prompt 8: Đăng nhập qua React và sử dụng Bearer JWT
- **Context**: Tái sử dụng `POST /api/auth/login` và `GET /api/auth/profile` của Chương 06.
- **Task**: Viết component `Login.tsx` nhập email/password; gửi request đăng nhập; lưu token trong bộ nhớ ứng dụng; gọi Profile để hiển thị thông tin; có nút Đăng xuất.
- **Constraint**: Không lưu token vào LocalStorage để tránh rủi ro XSS; xử lý đúng mã lỗi 401 khi đăng nhập sai hoặc token hết hạn.
- **Output**: File `frontend/src/components/Login.tsx`.

### Prompt 9: Nút Xóa sinh viên: Chỉ Admin thực thi
- **Context**: `DELETE /api/v1/sinh-vien/:maSV` yêu cầu cả `isAuth` và `isAdmin`.
- **Task**: Thêm nút Xóa ở mỗi dòng trong `SinhVienTable` khi `profile.role === 'admin'`; hiển thị hộp thoại xác nhận mã SV trước khi xóa; gửi Axios DELETE kèm header Authorization Bearer; làm mới danh sách sau khi xóa thành công.
- **Constraint**: Tài khoản student không thấy nút xóa; nếu cố tình ép gọi qua API thì Backend vẫn trả 403; không xóa dòng trên UI khi server trả lỗi.
- **Output**: Tích hợp logic xóa vào `SinhVienTable.tsx`.

### Prompt 10: Upload Avatar trực tiếp trên giao diện React
- **Context**: Đã có endpoint `POST /api/auth/me/avatar`.
- **Task**: Viết component `AvatarUpload.tsx` cho phép chọn ảnh (accept jpeg/png); kiểm tra trước dung lượng 2MB tại trình duyệt; đóng gói `FormData` với field `avatar`; gửi kèm JWT; hiển thị ảnh đại diện từ URL máy chủ.
- **Constraint**: Không tự đặt header Content-Type thiếu boundary; refresh Profile sau khi upload thành công; hiển thị ảnh thông qua `${API_BASE_URL}${avatarUrl}`.
- **Output**: File `frontend/src/components/AvatarUpload.tsx` và giao diện tổng hợp trong `frontend/src/App.tsx`.

---

## 3. Phản biện đoạn code AI nguy hiểm (Security Review)

### Bảng phân tích lỗ hổng & biện pháp khắc phục:

| STT | Đoạn code sai / Lỗ hổng | Rủi ro & Hệ quả | Biện pháp khắc phục chuẩn |
|:---:|---|---|---|
| **1** | Bỏ qua middleware `isAuth` | Bất kỳ ai không đăng nhập cũng có thể gửi file làm tràn ngập ổ đĩa server (DDoS/Storage exhaustion). | Bắt buộc đặt `isAuth` **trước** `Multer` để chặn người dùng nặc danh ngay lập tức. |
| **2** | Tin cậy `req.body.userId` | Kẻ tấn công có thể sửa đổi ảnh đại diện của người dùng khác (Insecure Direct Object References - IDOR). | Lấy ID người dùng độc quyền từ `req.user.sub` đã được JWT giải mã và xác thực. |
| **3** | Dùng nguyên `req.file.originalname` | Dễ bị tấn công Path Traversal (`../../malicious.php`), ghi đè tệp của người khác hoặc lỗi ký tự đặc biệt trên OS. | Sinh tên file ngẫu nhiên duy nhất phía server bằng `crypto.randomUUID() + ext`. |
| **4** | Không cấu hình giới hạn kích thước (`limits`) | Kẻ xấu có thể upload file hàng trăm Megabyte làm sập server hoặc cạn kiệt dung lượng đĩa. | Giới hạn nghiêm ngặt `limits: { fileSize: 2 * 1024 * 1024 }` và trả về HTTP 413. |
| **5** | Không kiểm tra nội dung thực tế của file | File mã độc dạng thực thi, shell script, hoặc file văn bản có thể bị đổi đuôi giả mạo thành `.png` để vượt qua bộ lọc đơn giản. | Kiểm tra chữ ký file thực tế (Magic bytes: PNG `89 50 4E 47...`, JPEG `FF D8 FF...`); xóa file ngay nếu sai. |
| **6** | CORS wildcard `app.use(cors())` mở toàn bộ | Bất kỳ website độc hại nào cũng có thể gửi request cross-origin từ trình duyệt của nạn nhân. | Cấu hình allowlist nguồn gốc cụ thể (`origin: ['http://localhost:5173']`) và bật `credentials: true`. |
| **7** | Lưu chỉ originalname vào CSDL | Đường dẫn không có tiền tố thư mục phục vụ tĩnh `/uploads/`, client không thể truy cập được ảnh qua HTTP. | Lưu đường dẫn tương đối chuẩn `/uploads/<server-generated-filename>`. |

---

## 4. Trả lời 12 câu hỏi bảo vệ bài thực hành (Oral Defense)

1. **`application/json` khác `multipart/form-data` ở điểm nào? Vì sao `express.json()` không đủ cho file?**
   - `application/json` mã hóa dữ liệu thành chuỗi văn bản JSON, chỉ phù hợp cho văn bản hoặc dữ liệu có cấu trúc đơn giản. Nó không hiệu quả và không hỗ trợ truyền tải trực tiếp dữ liệu nhị phân (binary stream) của tệp tin.
   - `multipart/form-data` phân tách nội dung request thành nhiều phần (parts) ngăn cách bởi các đường biên (boundary). Mỗi phần có header riêng (tên trường, filename, Content-Type) và body có thể chứa chuỗi nhị phân nguyên bản của file.
   - Middleware `express.json()` chỉ có nhiệm vụ đọc và phân tích các request có Content-Type là `application/json`. Nó hoàn toàn bỏ qua hoặc không thể phân tách luồng nhị phân đa phần của `multipart/form-data`, do đó cần đến thư viện chuyên dụng như `multer`.

2. **Điều gì xảy ra khi FormData dùng `photo` nhưng Multer cấu hình `single("avatar")`?**
   - Multer sẽ phát hiện tên field trong request không khớp với trường nó mong đợi (`avatar`).
   - Multer sẽ phát sinh lỗi `MulterError: Unexpected field` với mã lỗi `LIMIT_UNEXPECTED_FILE`. Nếu có error middleware xử lý, server sẽ phản hồi HTTP `400 Bad Request`. Request bị từ chối và file không được ghi vào thư mục lưu trữ.

3. **`req.file` và `req.body` nằm ở đâu sau Multer? `req.user` xuất hiện ở bước nào?**
   - Sau khi Multer xử lý xong:
     - `req.file`: chứa đối tượng metadata của file vừa upload (filename, path, size, mimetype, originalname).
     - `req.body`: chứa các trường dữ liệu dạng text gửi kèm trong form-data (nếu có).
   - `req.user`: xuất hiện từ middleware `isAuth` (chạy trước Multer). `isAuth` giải mã JWT từ header `Authorization: Bearer <token>` và gán payload vào `req.user`.

4. **Vì sao gọi `isAuth` trước Multer? Có cần `isAdmin` để User đổi Avatar chính mình không?**
   - Gọi `isAuth` trước Multer là nguyên tắc phòng thủ chiều sâu quan trọng: Nếu một request không có token hoặc token không hợp lệ, hệ thống sẽ ngắt luồng và trả về HTTP `401 Unauthorized` ngay lập tức, ngăn không cho Multer tốn tài nguyên CPU/ổ đĩa để tiếp nhận và ghi file lên đĩa.
   - **Không cần** `isAdmin` để người dùng đổi Avatar chính mình, vì ảnh đại diện là tài nguyên cá nhân của mỗi tài khoản. Chỉ cần xác thực đúng danh tính qua `isAuth` là người dùng có quyền cập nhật hồ sơ của chính mình.

5. **Vì sao không nhận `userId` trong body cho endpoint `/me/avatar`?**
   - Nếu nhận `userId` từ body, người dùng A có thể truyền `userId` của người dùng B, dẫn đến lỗ hổng IDOR (Insecure Direct Object References) nghiêm trọng, cho phép một người dùng tùy tiện thay đổi ảnh của người khác.
   - Luôn luôn lấy ID từ `req.user.sub` đã được hệ thống xác minh qua chữ ký JWT để đảm bảo an toàn tuyệt đối.

6. **Ổ đĩa chứa dữ liệu nào, còn `dbo.Users.avatarUrl` chứa giá trị gì?**
   - **Ổ đĩa** (thư mục vật lý `public/uploads/`): Lưu trữ file nhị phân thực tế của ảnh (ví dụ: `c54500f4-3356-4590-ba1c-fba06d01cc11.png`).
   - **`dbo.Users.avatarUrl`** trong CSDL: Chỉ lưu chuỗi đường dẫn URL tương đối (ví dụ: `/uploads/c54500f4-3356-4590-ba1c-fba06d01cc11.png`). Cơ sở dữ liệu không bao giờ lưu trữ trực tiếp file nhị phân để tránh làm phình to dung lượng database và suy giảm hiệu năng truy vấn.

7. **2MB tương ứng bao nhiêu byte? File 2.200.000 byte nên trả status nào?**
   - \(2 \text{ MB} = 2 \times 1024 \times 1024 = 2.097.152 \text{ bytes}\).
   - File 2.200.000 bytes lớn hơn 2.097.152 bytes, do đó Multer sẽ kích hoạt lỗi `LIMIT_FILE_SIZE` và server phải trả về mã HTTP **`413 Payload Too Large`**.

8. **Chỉ kiểm mimetype và `.png` có đủ để khẳng định file là ảnh PNG hợp lệ không?**
   - **Hoàn toàn không đủ.**
   - Mimetype và phần mở rộng (extension) là những thông tin do client tự gửi lên trong header HTTP và tên file, kẻ tấn công có thể dễ dàng đổi tên file script mã độc hoặc file text thành `.png` và giả mạo mimetype thành `image/png`.
   - Để khẳng định ảnh hợp lệ, bắt buộc phải kiểm tra **Magic Bytes (chữ ký số đầu file)**: với PNG, 8 byte đầu tiên phải khớp đúng `89 50 4E 47 0D 0A 1A 0A`.

9. **CORS kiểm soát điều gì? Vì sao Postman gọi API được nhưng browser lại báo CORS?**
   - CORS (Cross-Origin Resource Sharing) là cơ chế bảo mật do **trình duyệt web** thực thi để ngăn chặn các trang web độc hại đọc trộm tài nguyên từ một domain/origin khác mà không có sự cho phép của server.
   - Postman (hoặc curl/mobile app) là ứng dụng client độc lập, không phải trình duyệt web, nên nó không tuân theo và không áp đặt chính sách Same-Origin Policy của trình duyệt. Do đó Postman gọi API thành công bình thường, trong khi trình duyệt sẽ chặn đứng nếu server không trả về header `Access-Control-Allow-Origin` phù hợp.

10. **Axios GET `/api/v1/sinh-vien` nên đọc mảng ở `response.data` hay `response.data.data`?**
    - Phải đọc ở **`response.data.data`**.
    - Vì theo hợp đồng JSON thống nhất của hệ thống, backend trả về cấu trúc bọc chuẩn: `{ success: true, message: "...", data: [...] }`.
    - Khi Axios nhận phản hồi, toàn bộ JSON payload từ backend được đặt trong `response.data`. Do đó, mảng sinh viên nằm tại `response.data.data`.

11. **Vì sao Student bị ẩn nút Xóa vẫn phải bị chặn DELETE ở Backend?**
    - Ẩn nút trên giao diện chỉ là trải nghiệm người dùng (UX), hoàn toàn **không phải là biện pháp bảo mật**.
    - Kẻ tấn công có thể dễ dàng mở DevTools, dùng Postman hoặc viết mã script gọi trực tiếp request `DELETE /api/v1/sinh-vien/:maSV` kèm token của Student.
    - Do đó, tầng Backend bắt buộc phải có middleware `isAuth` + `isAdmin` kiểm tra vai trò để trả về HTTP `403 Forbidden` và chặn đứng mọi hành vi xóa trái phép.

12. **Trình bày ba bằng chứng cần có để chứng minh upload Avatar thật sự thành công.**
    - **Bằng chứng 1 (Phản hồi API)**: Postman / Network tab trả về HTTP `200 OK` với body `{ success: true, message: "...", data: { avatarUrl: "/uploads/<filename>.png" } }`.
    - **Bằng chứng 2 (Hệ thống tệp vật lý)**: Trong thư mục `public/uploads/` trên ổ đĩa xuất hiện tệp ảnh mới với tên file ngẫu nhiên khớp với URL trả về, và có thể mở xem trực tiếp qua trình duyệt tại `http://localhost:5000/uploads/<filename>.png`.
    - **Bằng chứng 3 (Cơ sở dữ liệu SQL Server)**: Truy vấn `SELECT avatarUrl FROM dbo.Users WHERE id = <userId>` xác nhận trường `avatarUrl` đã được cập nhật chính xác đường dẫn ảnh mới.
