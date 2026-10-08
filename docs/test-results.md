# Báo Cáo Kết Quả Kiểm Thử (Test Results) - Buổi 5: RESTful CRUD & Swagger

Dự án: **Backend Quản Lý Sinh Viên**  
Môi trường kiểm thử: `Node.js v20` + `SQL Server 2014` + `Sequelize 6`  
Base URL: `http://localhost:5000`

---

## 1. Bảng 12 Test Case Bắt Buộc

| ID | Điều kiện / Thao tác | Method & URL | Request Body | Expected Status | Actual Status | Xác nhận thêm & Kiểm chứng | Kết luận |
|---|---|---|---|:---:|:---:|---|:---:|
| **T01** | GET danh sách ban đầu | `GET /api/v1/sinh-vien` | *None* | 200 | 200 | `data` là mảng chứa danh sách sinh viên hiện có | **PASS** |
| **T02** | POST SV003 hợp lệ | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | 201 | 201 | `data.maSV == "SV003"`, thêm thành công vào SQL Server | **PASS** |
| **T03** | POST SV003 lần hai | `POST /api/v1/sinh-vien` | `{"maSV":"SV003","hoTen":"Ngọc Mai","email":"ngocmai@example.com","maLop":"25CT114"}` | 409 | 409 | Báo lỗi `Mã sinh viên đã tồn tại`, không tạo bản ghi trùng | **PASS** |
| **T04** | POST thiếu hoTen | `POST /api/v1/sinh-vien` | `{"maSV":"SV004","email":"thunghiem@example.com","maLop":"25CT114"}` | 400 | 400 | Báo lỗi thiếu trường bắt buộc, không ghi dữ liệu | **PASS** |
| **T05** | GET SV003 sau tạo | `GET /api/v1/sinh-vien/SV003` | *None* | 200 | 200 | Đọc đúng 4 trường của SV003 từ CSDL | **PASS** |
| **T06** | PUT SV003 đủ 3 trường | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Updated","email":"ngocmai@example.com","maLop":"25CT114"}` | 200 | 200 | Cập nhật thành công; GET lại thấy `hoTen` đã đổi thành `Ngọc Mai Updated` | **PASS** |
| **T07** | PUT SV003 thiếu email | `PUT /api/v1/sinh-vien/SV003` | `{"hoTen":"Ngọc Mai Updated 2","maLop":"25CT114"}` | 400 | 400 | Báo lỗi thiếu trường email; dữ liệu cũ trong CSDL được giữ nguyên | **PASS** |
| **T08** | PUT SV9999 body hợp lệ | `PUT /api/v1/sinh-vien/SV9999` | `{"hoTen":"Test","email":"test@example.com","maLop":"25CT114"}` | 404 | 404 | Báo `Không tìm thấy sinh viên`; không sinh thêm bản ghi lạ | **PASS** |
| **T09** | GET SV9999 không tồn tại | `GET /api/v1/sinh-vien/SV9999` | *None* | 404 | 404 | Báo lỗi `Không tìm thấy sinh viên` kèm `data: null` | **PASS** |
| **T10** | DELETE SV003 | `DELETE /api/v1/sinh-vien/SV003` | *None* | 200 | 200 | Báo `Xóa sinh viên thành công`, bản ghi bị xóa khỏi CSDL | **PASS** |
| **T11** | GET SV003 sau khi xóa | `GET /api/v1/sinh-vien/SV003` | *None* | 404 | 404 | Trả về 404 xác nhận sinh viên SV003 không còn tồn tại | **PASS** |
| **T12** | DELETE SV003 lần hai | `DELETE /api/v1/sinh-vien/SV003` | *None* | 404 | 404 | Báo lỗi 404 do sinh viên đã bị xóa trước đó | **PASS** |

---

## 2. Chi tiết thực nghiệm các ca kiểm thử quan trọng

### Ca kiểm thử T06 & T07 (Xác thực PUT):
- **Trước khi PUT**: `SV003` có tên là `Ngọc Mai`, email là `ngocmai@example.com`.
- **Thực hiện T07**: Gửi PUT thiếu trường `email` -> Server từ chối và trả về status `400 Bad Request`.
- **Kiểm chứng sau T07**: Thực hiện `GET /api/v1/sinh-vien/SV003` -> `hoTen` vẫn giữ nguyên là `Ngọc Mai`, chứng minh tính toàn vẹn dữ liệu khi gặp request lỗi.
- **Thực hiện T06**: Gửi PUT đủ 3 trường hợp lệ -> Server cập nhật và trả về `200 OK`. `GET` lại xác nhận `hoTen` đã chuyển thành `Ngọc Mai Updated`.

### Ca kiểm thử T10, T11 & T12 (Xác thực DELETE):
- **Thực hiện T10**: Gửi `DELETE /api/v1/sinh-vien/SV003` -> Server xóa bản ghi và trả về `200 OK` với `{"success": true, "message": "Xóa sinh viên thành công"}`.
- **Thực hiện T11**: Gửi `GET /api/v1/sinh-vien/SV003` -> Server trả về `404 Not Found` kèm `data: null`.
- **Thực hiện T12**: Gửi `DELETE /api/v1/sinh-vien/SV003` lần 2 -> Server trả về `404 Not Found`, bảo toàn tính Idempotent và nhất quán.

---

## 3. Kiểm thử giao diện Swagger UI
- URL tài liệu: `http://localhost:5000/api-docs`
- Khớp 100% với đặc tả OpenAPI 3.0.3 trong file `docs/openapi.yaml`.
- Đã kiểm thử trực tiếp trên Swagger UI tính năng "Try it out" cho đủ 5 phương thức: `GET` danh sách, `GET` chi tiết, `POST`, `PUT`, `DELETE`.
