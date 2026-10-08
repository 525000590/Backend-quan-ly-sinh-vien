# Prompt Log - Buổi 5: RESTful CRUD & Swagger

## 1. Bối cảnh dự án
- **Dự án**: `backend-quan-ly-sinh-vien` (Node.js, Express 5, TypeScript ESM/NodeNext, Sequelize 6, SQL Server).
- **Mục tiêu**: Hoàn thiện 5 API RESTful CRUD (bổ sung PUT và DELETE), tích hợp Swagger UI qua đặc tả OpenAPI 3.0.3 YAML riêng và kiểm thử tự động với 12 test case trên Postman.

---

## 2. Nhật ký Prompt theo khung CTCO

### Nhiệm vụ 1: Bổ sung API PUT (Cập nhật sinh viên)
- **Context**: Dự án Express + TypeScript theo kiến trúc Route -> Controller -> Service, kết nối SQL Server bằng Sequelize ORM.
- **Task**: Bổ sung endpoint `PUT /api/v1/sinh-vien/:maSV`.
- **Constraint**:
  - Lấy `maSV` từ URL param; body bắt buộc đủ 3 trường `hoTen`, `email`, `maLop`.
  - Không cho phép cập nhật `maSV` qua body.
  - Body sai định dạng/thiếu trường trả về `400 Bad Request`.
  - Mã sinh viên không tồn tại trả về `404 Not Found`.
  - Thành công trả về `200 OK` với dữ liệu sinh viên đã cập nhật.
- **Output**: File `src/services/sinhVien.service.ts`, `src/controllers/sinhVien.controller.ts`, `src/routes/sinhVien.routes.ts`.
- **Kết quả**: Đã thêm hàm `capNhatSinhVien`, kiểm tra validation độ dài (hoTen <= 150, email <= 254, maLop <= 50), cập nhật CSDL bằng `sinhVien.update()`.

### Nhiệm vụ 2: Bổ sung API DELETE (Xóa sinh viên)
- **Context**: Tiếp tục dự án Quản lý sinh viên với CSDL SQL Server.
- **Task**: Bổ sung endpoint `DELETE /api/v1/sinh-vien/:maSV`.
- **Constraint**:
  - Lấy `maSV` từ URL param; không gửi body.
  - Không tìm thấy trả `404 Not Found`.
  - Xóa thành công trả `200 OK` với `{"success": true, "message": "Xóa sinh viên thành công"}` (không có `data`).
  - Xóa lại lần thứ hai trả `404 Not Found`.
- **Output**: File `src/services/sinhVien.service.ts`, `src/controllers/sinhVien.controller.ts`, `src/routes/sinhVien.routes.ts`.
- **Kết quả**: Xóa bản ghi thành công qua `sinhVien.destroy()`, trả đúng cấu trúc phản hồi.

### Nhiệm vụ 3: Tích hợp Swagger UI với file YAML riêng
- **Context**: Dự án đã có đủ 5 API CRUD sinh viên.
- **Task**: Tạo tài liệu đặc tả `docs/openapi.yaml` chuẩn OpenAPI 3.0.3 và tích hợp Swagger UI tại `/api-docs`.
- **Constraint**:
  - Tách riêng file `docs/openapi.yaml`, không dùng JSDoc hay Decorator rải rác trong code.
  - Dùng `js-yaml` để parse và `swagger-ui-express` để phục vụ giao diện tài liệu.
  - Không tạo thêm Express app hay server mới.
- **Output**: `docs/openapi.yaml`, `src/config/swagger.config.ts`, tích hợp vào `src/server.ts`.
- **Kết quả**: Truy cập `http://localhost:5000/api-docs` hiển thị giao diện trực quan với đầy đủ 5 endpoint và schema.

---

## 3. Bài tự viết prompt theo CTCO (Tính năng tìm sinh viên theo lớp)

### Giải thích chọn endpoint:
Chọn endpoint `GET /api/v1/sinh-vien?maLop=...` (query parameter) hoặc `GET /api/v1/lop/:maLop/sinh-vien` (sub-resource). Việc sử dụng Query Parameter `maLop` là lựa chọn linh hoạt nhất theo chuẩn RESTful để lọc danh sách sinh viên mà không làm thay đổi hay phá vỡ cấu trúc của endpoint `GET /api/v1/sinh-vien` hiện tại.

### Nội dung Prompt:
- **Context**: Tôi đang phát triển dự án Quản lý sinh viên bằng Node.js + Express 5 + TypeScript + Sequelize 6 (SQL Server) theo mô hình 3 tầng Route -> Controller -> Service.
- **Task**: Bổ sung tính năng lọc danh sách sinh viên theo mã lớp thông qua query param `GET /api/v1/sinh-vien?maLop=...`.
- **Constraint**:
  1. Giữ nguyên tính tương thích của endpoint `GET /api/v1/sinh-vien` (nếu không có query `maLop` thì trả về toàn bộ sinh viên như cũ).
  2. Nếu có `maLop`, thực hiện truy vấn `findAll` với điều kiện `where: { maLop }`.
  3. Nếu lớp chưa có sinh viên nào, trả về mảng rỗng `[]` kèm status 200.
  4. Giữ đúng chuẩn response `{ success: true, message: "...", data: [...] }`.
- **Output**: Chỉ rõ các dòng code cần chỉnh sửa trong `src/services/sinhVien.service.ts` và `src/controllers/sinhVien.controller.ts`, cùng kịch bản test trên Postman.

---

## 4. Trả lời các câu hỏi trọng tâm của giảng viên

1. **Trong prompt của bạn, đâu là Context? Task? Constraint? Output?**
   - **Context**: Mô tả nền tảng công nghệ, dự án hiện tại, cấu trúc thư mục đang có.
   - **Task**: Hành động cụ thể cần thực hiện (ví dụ: tạo endpoint PUT, tạo file YAML).
   - **Constraint**: Các giới hạn kỹ thuật bắt buộc (status code, cấu trúc response, kiểu dữ liệu, không đổi thư viện).
   - **Output**: Định dạng kết quả đầu ra mong muốn nhận được từ AI (code cụ thể, giải thích luồng, kịch bản test).

2. **AI đã đổi những file nào? Vì sao không nên viết truy vấn DB ở Route?**
   - Đã chỉnh sửa/tạo mới: `src/routes/sinhVien.routes.ts`, `src/controllers/sinhVien.controller.ts`, `src/services/sinhVien.service.ts`, `src/config/swagger.config.ts`, `src/server.ts`, `docs/openapi.yaml`.
   - **Không nên viết truy vấn DB ở Route** vì vi phạm nguyên lý đơn nhiệm (Single Responsibility Principle). Route chỉ làm nhiệm vụ định tuyến URL đến Controller. Việc tách biệt giúp code dễ bảo trì, dễ viết unit test và dễ dàng thay đổi tầng dữ liệu (từ RAM sang SQL Server/MongoDB) mà không phải sửa lại toàn bộ ứng dụng.

3. **Mã HTTP 400, 404, 409 khác nhau ra sao?**
   - `400 Bad Request`: Dữ liệu gửi lên sai định dạng, thiếu trường bắt buộc, hoặc vi phạm quy tắc validation.
   - `404 Not Found`: Không tìm thấy tài nguyên được yêu cầu (URL sai hoặc `maSV` không tồn tại trong CSDL).
   - `409 Conflict`: Xảy ra xung đột trạng thái dữ liệu (ví dụ: `maSV` đã tồn tại trong CSDL khi tạo mới).

4. **Test nào chứng minh dữ liệu đã ghi thật, không chỉ trả response đẹp?**
   - Test `T05` (GET lại sau khi POST `T02`), `T06` (GET lại sau khi PUT `T06`), và `T11` (GET lại sau khi DELETE `T10`). Ngoài ra, sau khi restart server Node.js, thực hiện GET lại vẫn thấy dữ liệu tồn tại chứng minh dữ liệu đã được ghi bền vững vào SQL Server trên đĩa cứng.
