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
