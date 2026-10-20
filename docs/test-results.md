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



---

# Báo Cáo Kết Quả Kiểm Thử (Test Results) - Buổi 08: Upload Hình Ảnh & Kết Nối Frontend - Backend (Chương 07)

Dự án: **Backend Quản Lý Sinh Viên** + **Frontend Vite React**  
Môi trường kiểm thử: `Node.js v20` + `Express 5` + `TypeScript` + `SQL Server 2014` + `Sequelize 6` + `Multer` + `Vite React 19` + `Axios`  
Backend URL: `http://localhost:5000` (hoặc `PORT` cấu hình trong `.env`)  
Frontend URL: `http://localhost:5173`  
Thư mục lưu trữ tĩnh: `public/uploads/`  

---

## 1. Ma trận 12 Ca Kiểm Thử Multer, JWT và Lưu Trữ (U01 – U12)

| Mã ca | Tình huống kiểm thử | Method & URL | Dữ liệu / Header kiểm thử | Expected | Actual | Bằng chứng & Xác minh dữ liệu | Kết luận |
|---|---|---|---|:---:|:---:|---|:---:|
| **U01** | Avatar PNG hợp lệ + Student JWT | `POST /api/auth/me/avatar` | Bearer Student JWT; Form field `avatar` chứa file 1x1 PNG | 200 | 200 | File sinh mới trong `public/uploads/`, URL dạng `/uploads/<uuid>.png`, CSDL SQL Server cập nhật đúng `avatarUrl` của User | **PASS** |
| **U02** | Avatar JPEG hợp lệ + Xem ảnh tĩnh | `POST /api/auth/me/avatar` & `GET /uploads/...` | Bearer Student JWT; Form field `avatar` chứa file JPEG hợp lệ | 200 | 200 | Trình duyệt và Postman mở được ảnh tĩnh qua URL `/uploads/...`, HTTP trả về 200 OK | **PASS** |
| **U03** | Không có Authorization | `POST /api/auth/me/avatar` | *Không gửi Authorization header*; kèm file PNG | 401 | 401 | `isAuth` chặn trước Multer; số lượng file trong `public/uploads/` không tăng, CSDL không đổi | **PASS** |
| **U04** | JWT sai hoặc hết hạn | `POST /api/auth/me/avatar` | `Authorization: Bearer invalid.token.signature` | 401 | 401 | Chặn token không hợp lệ; không tạo file mới trên đĩa và không cập nhật URL | **PASS** |
| **U05** | Body thiếu file | `POST /api/auth/me/avatar` | Bearer Student JWT; Form-data rỗng (không đính kèm file) | 400 | 400 | Phản hồi thông báo `Vui lòng chọn file ảnh đại diện`; CSDL giữ nguyên | **PASS** |
| **U06** | Field photo thay vì avatar | `POST /api/auth/me/avatar` | Bearer Student JWT; Form field tên `photo` | 400 | 400 | Multer bắt `Unexpected field`; từ chối request, không lưu file vào thư mục tĩnh | **PASS** |
| **U07** | Kích thước file > 2MB | `POST /api/auth/me/avatar` | Bearer Student JWT; file ảnh JPEG dung lượng 2.2MB | 413 | 413 | Bắt lỗi `LIMIT_FILE_SIZE`; trả về đúng HTTP 413 theo quy ước lab, không để lại file rác | **PASS** |
| **U08** | TXT đổi tên thành avatar.png | `POST /api/auth/me/avatar` | Bearer Student JWT; file text giả mạo đổi đuôi `.png` | 400 | 400 | Kiểm tra Magic Bytes phát hiện sai chữ ký số; tự động xóa ngay file rác và trả về 400 | **PASS** |
| **U09** | Đuôi .gif / MIME không chấp nhận | `POST /api/auth/me/avatar` | Bearer Student JWT; file ảnh GIF (`image/gif`) | 400 | 400 | FileFilter từ chối định dạng GIF; không tạo file công khai mới | **PASS** |
| **U10** | Upload hai lần cùng tài khoản | `POST /api/auth/me/avatar` (x2) | Lần 1: file PNG; Lần 2: file JPEG | 200 | 200 | Cả hai lần đều 200; lần 2 sinh UUID mới, không ghi đè bất ngờ | **PASS** |
| **U11** | Student A gửi userId của B trong body | `POST /api/auth/me/avatar` | Token của Student A; Form-data đính kèm `userId: <id_cua_B>` | 200 | 200 | Hệ thống bỏ qua `userId` trong body và chỉ cập nhật cho A; avatar của B giữ nguyên 100% | **PASS** |
| **U12** | Restart server rồi GET Profile | `GET /api/auth/profile` | Khởi động lại Backend; Bearer Student JWT | 200 | 200 | `avatarUrl` trong CSDL được bảo toàn; ảnh tĩnh vẫn hiển thị chính xác | **PASS** |

**Tỷ lệ đạt Bảng U (Multer & Upload): 12/12 ca (100% PASS)**

---

## 2. Ma trận 12 Ca Kiểm Thử Frontend Vite, Axios, CORS và Phân Quyền (F01 – F12)

| Mã ca | Tình huống kiểm thử | Giao diện / Thao tác | Expected | Actual | Bằng chứng xác minh | Kết luận |
|---|---|---|---|---|---|:---:|
| **F01** | Vite chạy, Backend bật | Mở `http://localhost:5173` trên trình duyệt | Trang mở thành công | Trang mở thành công | Header báo "Backend: Hoạt động (200)"; Network tab ghi nhận gọi `GET /health` thành công | **PASS** |
| **F02** | GET danh sách có dữ liệu | Màn hình chính tải dữ liệu ban đầu | Bảng 4 cột | Bảng 4 cột | Bảng hiển thị đầy đủ các cột Mã SV, Họ Tên, Email, Mã Lớp khớp nội dung trong CSDL | **PASS** |
| **F03** | GET data = [] | Khi CSDL không có bản ghi sinh viên nào | Thông báo rỗng | Thông báo rỗng | Giao diện hiển thị thông báo "Hiện tại danh sách sinh viên đang trống", không bị crash | **PASS** |
| **F04** | Backend tắt khi GET | Dừng tiến trình Backend server rồi tải lại trang | Báo lỗi Error | Báo lỗi Error | Hiển thị box thông báo lỗi kết nối và nút "Thử lại", không bị treo vòng xoay loading vô hạn | **PASS** |
| **F05** | Bật lại Backend, bấm thử lại | Khởi động lại Backend và nhấn nút "Thử lại" | Bảng hiện lại | Bảng hiện lại | Bảng danh sách sinh viên tải lại và hiển thị bình thường | **PASS** |
| **F06** | Login đúng student | Nhập `student.test@example.com` / `Student@123` | Đăng nhập 200 | Đăng nhập 200 | Nhận JWT trong bộ nhớ, tự động gọi `GET /api/auth/profile` và hiển thị badge `STUDENT` | **PASS** |
| **F07** | Login sai mật khẩu | Nhập mật khẩu sai | Báo lỗi 401 | Báo lỗi 401 | Hiển thị thông báo "Email hoặc mật khẩu không chính xác (401 Unauthorized)", không lưu token giả | **PASS** |
| **F08** | GET Profile thiếu token | Chưa đăng nhập hoặc token hết hạn | Yêu cầu login | Yêu cầu login | Giao diện hiển thị form Đăng nhập, không để lộ thông tin hồ sơ cá nhân | **PASS** |
| **F09** | Student ép gọi DELETE | Đăng nhập tài khoản Student | Không có nút Xóa | Không có nút Xóa | Cột "Thao tác" không xuất hiện trên bảng; nếu ép gọi qua Postman/Axios thì Backend chặn 403 Forbidden | **PASS** |
| **F10** | Admin bấm DELETE bản ghi test | Đăng nhập Admin (`admin@example.com`), bấm "Xóa" SV098 | Xóa 200 | Xóa 200 | Hiển thị confirm xác nhận; sau khi đồng ý, gửi `DELETE` có Bearer token, bảng tự làm mới loại bỏ SV098 | **PASS** |
| **F11** | Avatar hợp lệ upload từ React | Chọn file ảnh PNG < 2MB, bấm "Cập Nhật Avatar" | Upload 200 | Upload 200 | Network gửi multipart/form-data; hiển thị ảnh vừa tải lên; CSDL lưu URL `/uploads/...` | **PASS** |
| **F12** | Origin khác Origin allowlist | Gửi request từ Origin lạ (ví dụ `http://evil.com` qua fetch) | CORS chặn | CORS chặn | Trình duyệt chặn và ném lỗi CORS: `Chặn bởi chính sách CORS: Origin không được phép` | **PASS** |

**Tỷ lệ đạt Bảng F (Frontend & CORS): 12/12 ca (100% PASS)**

---

## 3. Tổng kết nghiệm thu Buổi 08

- Đạt **100% (24/24 ca kiểm thử)** bao gồm cả 12 ca Backend Upload (U01–U12) và 12 ca Frontend/CORS (F01–F12).
- Toàn bộ các yêu cầu của Chương 07 đã được thỏa mãn tuyệt đối:
  - Hệ thống upload ảnh tĩnh qua **Multer** bảo mật, kiểm tra giới hạn dung lượng **2MB** (trả 413), kiểm tra **Magic Bytes** chống giả mạo đuôi tệp.
  - Phục vụ ảnh tĩnh an toàn qua `express.static('public/uploads')` dưới đường dẫn `/uploads/...`.
  - Phân quyền **RBAC** được bảo đảm chặt chẽ từ Backend tới Frontend: Student chỉ xem, Admin có toàn quyền thao tác.
  - Ứng dụng **Vite React + TypeScript + Axios** hoạt động mượt mà, kết nối API thật, hỗ trợ đầy đủ các trạng thái Loading/Empty/Error/Retry.
