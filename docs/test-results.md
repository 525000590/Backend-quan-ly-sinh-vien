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
