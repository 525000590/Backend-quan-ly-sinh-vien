# Báo Cáo Kết Quả Kiểm Thử (Test Results) - Buổi 06: Middlewares & Validation

Dự án: **Backend Quản Lý Sinh Viên**  
Môi trường kiểm thử: `Node.js v20` + `Express 5` + `TypeScript` + `SQL Server 2014` + `Sequelize 6` + `Zod 4` + `Morgan`  
Base URL: `http://localhost:5000`

---

## 1. Bảng 12 Test Case Validation Bắt Buộc (V01 – V12)

| Mã | Request / Tình huống | Method & URL | Payload / Body | Expected Status | Actual Status | Xác minh thêm & Bằng chứng dữ liệu | Kết luận |
|---|---|---|---|:---:|:---:|---|:---:|
| **V01** | POST SV006 đủ 4 trường hợp lệ | `POST /api/v1/sinh-vien` | `{"maSV":"SV006","hoTen":"Nguyễn Minh An","email":"minhan@example.com","maLop":"25CT114"}` | 201 | 201 | `data.maSV == "SV006"`, CSDL ghi nhận thành công sinh viên mới | **PASS** |
| **V02** | POST thiếu hoTen | `POST /api/v1/sinh-vien` | `{"maSV":"SV007","email":"minhan@example.com","maLop":"25CT114"}` | 400 | 400 | Báo lỗi `errors[0].field == "hoTen"`, không thêm sinh viên vào DB | **PASS** |
| **V03** | POST email không đúng định dạng | `POST /api/v1/sinh-vien` | `{"maSV":"SV007","hoTen":"Nguyễn Văn A","email":"khong-phai-email","maLop":"25CT114"}` | 400 | 400 | Báo lỗi `errors[0].field == "email"`, format email bị từ chối | **PASS** |
| **V04** | POST có thêm `role: "admin"` | `POST /api/v1/sinh-vien` | `{"maSV":"SV007","hoTen":"Nguyễn Văn A","email":"vana@example.com","maLop":"25CT114","role":"admin"}` | 400 | 400 | Zod `.strict()` chặn trường lạ ngoài hợp đồng | **PASS** |
| **V05** | PUT SV006 thiếu email | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An Updated","maLop":"25CT114"}` | 400 | 400 | GET lại thấy email cũ `minhan@example.com` (Dữ liệu được bảo toàn) | **PASS** |
| **V06** | PUT SV006 đủ 3 trường hợp lệ | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An Updated","email":"an.updated@example.com","maLop":"25CT114"}` | 200 | 200 | Cập nhật thành công; `hoTen` đổi thành `Nguyễn Minh An Updated` | **PASS** |
| **V07** | PUT SV006 email sai kiểu (số) | `PUT /api/v1/sinh-vien/SV006` | `{"hoTen":"Nguyễn Minh An","email":12345,"maLop":"25CT114"}` | 400 | 400 | Từ chối kiểu số, không ghi dữ liệu sai vào CSDL | **PASS** |
| **V08** | POST maSV đã tồn tại | `POST /api/v1/sinh-vien` | `{"maSV":"SV006","hoTen":"Nguyễn Minh An","email":"minhan@example.com","maLop":"25CT114"}` | 409 | 409 | Báo lỗi `Mã sinh viên đã tồn tại`, ngăn trùng lặp ở tầng Service/DB | **PASS** |
| **V09** | PUT mã không tồn tại body hợp lệ | `PUT /api/v1/sinh-vien/SV9999` | `{"hoTen":"Test Non Existent","email":"test@example.com","maLop":"25CT114"}` | 404 | 404 | Báo `Không tìm thấy sinh viên`, không tạo bản ghi mới | **PASS** |
| **V10** | GET danh sách sinh viên | `GET /api/v1/sinh-vien` | *None* | 200 | 200 | `data` là mảng chứa danh sách sinh viên hợp lệ | **PASS** |
| **V11** | GET /health kiểm tra logs | `GET /health` | *None* | 200 | 200 | Server phản hồi 200; `logs/access.log` ghi nhận dòng log mới | **PASS** |
| **V12** | Restart server, kiểm tra ghi nối | `GET /` | *None* | 200 | 200 | Server khởi động lại, `logs/access.log` ghi nối (append) không bị ghi đè | **PASS** |

---

## 2. Chi tiết thực nghiệm ca V05 (Kiểm chứng bảo toàn dữ liệu)

- **Trước khi gọi PUT (V05)**: Sinh viên `SV006` có thông tin:
  - `hoTen`: `"Nguyễn Minh An"`
  - `email`: `"minhan@example.com"`
  - `maLop`: `"25CT114"`
- **Thực hiện request PUT sai (thiếu email)**:
  - Payload gửi lên: `{"hoTen": "Nguyễn Minh An Updated", "maLop": "25CT114"}`
  - Kết quả trả về: HTTP `400 Bad Request` kèm chi tiết lỗi tại field `email`.
- **Kiểm chứng bằng `GET /api/v1/sinh-vien/SV006` ngay sau đó**:
  - `hoTen` vẫn giữ nguyên là `"Nguyễn Minh An"`.
  - `email` vẫn giữ nguyên là `"minhan@example.com"`.
  - Không có bất kỳ thay đổi nào được ghi vào cơ sở dữ liệu.
- **Kết luận**: Validation Middleware đã chặn đứng request ngay tại trạm kiểm soát trước khi chạm tới Controller/Service, bảo đảm dữ liệu được bảo toàn 100%.

---

## 3. Nhật ký Request từ Morgan (`logs/access.log`)

Cấu hình Morgan `combined` với cờ append (`flags: 'a'`):

```text
::1 - - [13/Oct/2026:13:23:28 +0000] "GET /health HTTP/1.1" 200 40 "-" "node"
::1 - - [13/Oct/2026:13:23:28 +0000] "POST /api/v1/sinh-vien HTTP/1.1" 201 190 "-" "node"
::1 - - [13/Oct/2026:13:23:29 +0000] "POST /api/v1/sinh-vien HTTP/1.1" 400 178 "-" "node"
::1 - - [13/Oct/2026:13:23:29 +0000] "POST /api/v1/sinh-vien HTTP/1.1" 400 152 "-" "node"
::1 - - [13/Oct/2026:13:23:29 +0000] "POST /api/v1/sinh-vien HTTP/1.1" 400 151 "-" "node"
::1 - - [13/Oct/2026:13:23:29 +0000] "PUT /api/v1/sinh-vien/SV006 HTTP/1.1" 400 152 "-" "node"
::1 - - [13/Oct/2026:13:23:29 +0000] "GET /api/v1/sinh-vien/SV006 HTTP/1.1" 200 182 "-" "node"
::1 - - [13/Oct/2026:13:23:30 +0000] "PUT /api/v1/sinh-vien/SV006 HTTP/1.1" 200 206 "-" "node"
::1 - - [13/Oct/2026:13:23:30 +0000] "PUT /api/v1/sinh-vien/SV006 HTTP/1.1" 400 152 "-" "node"
::1 - - [13/Oct/2026:13:23:30 +0000] "POST /api/v1/sinh-vien HTTP/1.1" 409 76 "-" "node"
::1 - - [13/Oct/2026:13:23:30 +0000] "PUT /api/v1/sinh-vien/SV9999 HTTP/1.1" 404 80 "-" "node"
::1 - - [13/Oct/2026:13:23:31 +0000] "GET /api/v1/sinh-vien HTTP/1.1" 200 351 "-" "node"
```

---

## 4. Bảng Kiểm Thử Hồi Quy (Regression Test T01 – T12 từ Buổi 05)

| ID | Thao tác | Expected Status | Actual Status | Kết quả |
|---|---|:---:|:---:|:---:|
| **T01** | GET danh sách ban đầu | 200 | 200 | **PASS** |
| **T02** | POST SV003 hợp lệ | 201 | 201 | **PASS** |
| **T03** | POST SV003 lần hai (trùng mã) | 409 | 409 | **PASS** |
| **T04** | POST thiếu hoTen | 400 | 400 | **PASS** |
| **T05** | GET SV003 sau tạo | 200 | 200 | **PASS** |
| **T06** | PUT SV003 đủ 3 trường | 200 | 200 | **PASS** |
| **T07** | PUT SV003 thiếu email | 400 | 400 | **PASS** |
| **T08** | PUT SV9999 body hợp lệ | 404 | 404 | **PASS** |
| **T09** | GET SV9999 không tồn tại | 404 | 404 | **PASS** |
| **T10** | DELETE SV003 | 200 | 200 | **PASS** |
| **T11** | GET SV003 sau xóa | 404 | 404 | **PASS** |
| **T12** | DELETE SV003 lần hai | 404 | 404 | **PASS** |

**Tổng kết**: Hệ thống đã bổ sung đầy đủ Middleware Validation và Logging Morgan mà không phá vỡ bất kỳ hành vi hay cấu trúc phản hồi nào của các API CRUD trước đó.

---

# Báo Cáo Kết Quả Kiểm Thử (Test Results) - Buổi 07: Authentication & Authorization (JWT & RBAC)

Dự án: **Backend Quản Lý Sinh Viên**  
Môi trường kiểm thử: `Node.js v20` + `Express 5` + `TypeScript` + `SQL Server 2014` + `Sequelize 6` + `JWT (HS256)` + `Bcrypt (cost 12)`  
Base URL: `http://localhost:3000` (hoặc `PORT` cấu hình trong `.env`)  
Tài khoản Admin kiểm thử: `admin@example.com` / `Admin@123`  
Tài khoản Student kiểm thử: `student.test@example.com` / `Student@123`  

---

## 1. Bảng A — Kiểm thử Authentication (Register, Login, JWT & Profile) (A01 – A12)

| Mã | Tình huống kiểm thử | Method & URL | Headers / Payload | Expected Status | Actual Status | Bằng chứng & Xác minh dữ liệu | Kết luận |
|---|---|---|---|:---:|:---:|---|:---:|
| **A01** | Đăng ký tài khoản mới hợp lệ | `POST /api/auth/register` | `{"fullName":"Student Test","email":"a01.test@example.com","password":"Password@123"}` | 201 | 201 | Trả về `id`, `fullName`, `email`, `role: "student"`; không lộ `passwordHash` | **PASS** |
| **A02** | Đăng ký trùng email đã tồn tại | `POST /api/auth/register` | `{"fullName":"Duplicate","email":"student.test@example.com","password":"Password@123"}` | 409 | 409 | Trả về thông báo lỗi `Email đã được sử dụng`, không tạo bản ghi mới | **PASS** |
| **A03** | Đăng ký cố ý gửi kèm `role: "admin"` | `POST /api/auth/register` | `{"fullName":"Attacker","email":"hack@example.com","password":"Password@123","role":"admin"}` | 400 | 400 | Zod `.strict()` chặn trường ngoài schema; ngăn chặn Privilege Escalation | **PASS** |
| **A04** | Đăng ký payload sai (thiếu password, email sai) | `POST /api/auth/register` | `{"fullName":"Test","email":"not-an-email"}` | 400 | 400 | Trả về danh sách chi tiết các trường vi phạm validation Zod | **PASS** |
| **A05** | Đăng nhập hợp lệ bằng tài khoản student | `POST /api/auth/login` | `{"email":"student.test@example.com","password":"Student@123"}` | 200 | 200 | Nhận `accessToken` định dạng JWT 3 phần hợp lệ | **PASS** |
| **A06** | Đăng nhập sai mật khẩu | `POST /api/auth/login` | `{"email":"student.test@example.com","password":"WrongPassword"}` | 401 | 401 | Báo `Email hoặc mật khẩu không chính xác` (Anti User Enumeration) | **PASS** |
| **A07** | Đăng nhập với email không tồn tại | `POST /api/auth/login` | `{"email":"nonexistent@example.com","password":"Password@123"}` | 401 | 401 | Báo `Email hoặc mật khẩu không chính xác` (Anti User Enumeration) | **PASS** |
| **A08** | Lấy Profile không truyền header Authorization | `GET /api/auth/profile` | *Không có Authorization header* | 401 | 401 | Middleware `isAuth` chặn đứng, yêu cầu Bearer token | **PASS** |
| **A09** | Lấy Profile với token sai chữ ký | `GET /api/auth/profile` | `Authorization: Bearer <tampered-jwt>` | 401 | 401 | Thư viện `jsonwebtoken` phát hiện sai signature, từ chối truy cập | **PASS** |
| **A10** | Lấy Profile với token hợp lệ | `GET /api/auth/profile` | `Authorization: Bearer <valid-student-token>` | 200 | 200 | Trả thông tin `id`, `fullName`, `email`, `role: "student"`; không có `passwordHash` | **PASS** |
| **A11** | Lấy Profile với token đã hết hạn | `GET /api/auth/profile` | `Authorization: Bearer <expired-jwt>` | 401 | 401 | Trả về lỗi Token đã hết hạn | **PASS** |
| **A12** | Xác minh mật khẩu trong CSDL SQL Server | *Direct Query DB* | `SELECT passwordHash FROM dbo.Users WHERE email = 'student.test@example.com'` | N/A | N/A | Chuỗi băm bắt đầu bằng tiền tố `$2b$12$...` xác nhận bcrypt cost 12 | **PASS** |

**Tỷ lệ đạt Bảng A: 12/12 ca (100% PASS)**

---

## 2. Bảng B — Kiểm thử Phân Quyền RBAC trên Quản Lý Sinh Viên (B01 – B12)

| Mã | Tình huống kiểm thử | Method & URL | Quyền hạn / Header | Expected Status | Actual Status | Bằng chứng & Phản hồi | Kết luận |
|---|---|---|---|:---:|:---:|---|:---:|
| **B01** | GET danh sách sinh viên (Public) | `GET /api/v1/sinh-vien` | Public (Không cần token) | 200 | 200 | Lấy danh sách thành công mà không đòi hỏi xác thực | **PASS** |
| **B02** | POST thêm sinh viên không có JWT | `POST /api/v1/sinh-vien` | Không có header Authorization | 401 | 401 | `isAuth` chặn với mã 401 Unauthorized | **PASS** |
| **B03** | PUT sửa sinh viên với token sai chữ ký | `PUT /api/v1/sinh-vien/SV001` | Token bị giả mạo / sai secret | 401 | 401 | `isAuth` chặn với mã 401 Unauthorized | **PASS** |
| **B04** | DELETE sinh viên với JWT role `student` | `DELETE /api/v1/sinh-vien/SV001` | JWT student hợp lệ | 403 | 403 | `isAdmin` chặn với mã 403 Forbidden | **PASS** |
| **B05** | POST sinh viên với JWT role `student` | `POST /api/v1/sinh-vien` | JWT student hợp lệ | 403 | 403 | `isAdmin` chặn với mã 403 Forbidden | **PASS** |
| **B06** | PUT sinh viên với JWT role `student` | `PUT /api/v1/sinh-vien/SV001` | JWT student hợp lệ | 403 | 403 | `isAdmin` chặn với mã 403 Forbidden | **PASS** |
| **B07** | POST sinh viên hợp lệ với JWT role `admin` | `POST /api/v1/sinh-vien` | JWT admin hợp lệ, body SV098 | 201 | 201 | Tạo thành công sinh viên `SV098` trong CSDL | **PASS** |
| **B08** | PUT sinh viên hợp lệ với JWT role `admin` | `PUT /api/v1/sinh-vien/SV098` | JWT admin hợp lệ, cập nhật hoTen | 200 | 200 | Cập nhật thành công thông tin sinh viên `SV098` | **PASS** |
| **B09** | DELETE sinh viên với JWT role `admin` | `DELETE /api/v1/sinh-vien/SV098` | JWT admin hợp lệ | 200 | 200 | Xóa thành công; GET lại kiểm chứng trả về HTTP 404 | **PASS** |
| **B10** | Admin POST body sai schema Zod | `POST /api/v1/sinh-vien` | JWT admin hợp lệ, thiếu hoTen | 400 | 400 | `validate` chặn request sai trước khi chạm vào Service | **PASS** |
| **B11** | Admin POST trùng `maSV` đã tồn tại | `POST /api/v1/sinh-vien` | JWT admin hợp lệ, maSV đã có | 409 | 409 | Tầng Service/DB chặn trùng khóa chính với mã 409 Conflict | **PASS** |
| **B12** | Admin DELETE mã sinh viên không tồn tại | `DELETE /api/v1/sinh-vien/SV9999` | JWT admin hợp lệ | 404 | 404 | Trả về 404 Không tìm thấy sinh viên | **PASS** |

**Tỷ lệ đạt Bảng B: 12/12 ca (100% PASS)**

---

## 3. Tổng kết nghiệm thu Buổi 07

- Toàn bộ **24/24 ca kiểm thử** của Buổi 07 đều vượt qua (100% PASS).
- Hệ thống đáp ứng trọn vẹn yêu cầu bảo mật:
  - Mã hóa mật khẩu an toàn bằng **Bcrypt work factor 12**.
  - Quản lý phiên làm việc phi trạng thái (**Stateless JWT**) với thuật toán ký **HMAC-SHA256**.
  - Kiểm soát truy cập dựa trên vai trò (**RBAC**): Endpoint đọc là công khai; endpoint thêm, sửa, xóa bắt buộc quyền `admin`; tài khoản `student` bị từ chối với HTTP `403 Forbidden`.
  - Bộ lọc Zod Middleware ngăn chặn hiệu quả hành vi tiêm trường lạ hoặc leo thang đặc quyền trái phép.

