# Backend Quản Lý Sinh Viên - Buổi 4: SQL Server + Sequelize ORM

Dự án Backend Quản lý sinh viên được xây dựng bằng **Node.js, Express 5, TypeScript (ESM/NodeNext)** và chuyển đổi tầng lưu trữ dữ liệu từ RAM sang **Microsoft SQL Server** thông qua **Sequelize 6 ORM** và driver **Tedious**.

---

## 1. Cấu trúc thư mục dự án

```text
backend-quan-ly-sinh-vien/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── .env
├── .env.example
├── .gitignore
├── sql/
│   ├── 01-quan-ly-sinh-vien.sql      # Tạo CSDL QuanLySinhVienDB và bảng dbo.SinhVien
│   ├── 02-seed.sql                   # Nạp dữ liệu mẫu ban đầu (SV001, SV002)
│   ├── 03-app-login.sql              # Tạo Login sv_app và phân quyền SELECT, INSERT
│   └── 04-lop-va-quan-he.sql         # (Mở rộng) Bảng Lop và Khóa ngoại 1-N
├── src/
│   ├── config/
│   │   └── database.ts               # Cấu hình kết nối Sequelize với SQL Server
│   ├── dtos/
│   │   └── sinhVien.dto.ts           # DTO trao đổi dữ liệu (4 trường string)
│   ├── models/
│   │   ├── SinhVien.ts               # Model Sequelize ánh xạ bảng dbo.SinhVien
│   │   ├── Lop.ts                    # Model Sequelize ánh xạ bảng dbo.Lop (Mở rộng)
│   │   └── index.ts                  # Thiết lập quan hệ 1-N giữa Lop và SinhVien
│   ├── services/
│   │   └── sinhVien.service.ts       # Nghiệp vụ & thao tác DB qua Sequelize
│   ├── controllers/
│   │   └── sinhVien.controller.ts    # Điều hướng request/response và await Service
│   ├── routes/
│   │   └── sinhVien.routes.ts        # Định tuyến các endpoint API
│   ├── middlewares/
│   │   ├── logger.middleware.ts      # Log request
│   │   └── error.middleware.ts       # Xử lý lỗi tập trung (AppError, JSON syntax, 500)
│   ├── scripts/
│   │   ├── check-db.ts               # Script kiểm tra kết nối DB độc lập
│   │   └── check-lop-relation.ts     # Script kiểm tra quan hệ Model Lop - SinhVien
│   ├── utils/
│   │   └── AppError.ts               # Custom Error class cho nghiệp vụ
│   └── server.ts                     # Điểm khởi động ứng dụng (authenticate DB -> app.listen)
├── Backend_Sinh_Vien_Buoi_4_SQL_Server.postman_collection.json
└── README.md
```

---

## 2. Chuẩn bị SQL Server & Thứ tự chạy Script SQL

### Bước 2.1: Bật TCP/IP trên SQL Server Configuration Manager
1. Mở **SQL Server Configuration Manager** -> **SQL Server Network Configuration** -> **Protocols for [INSTANCE_NAME]** -> Bật **TCP/IP** (`Enabled = Yes`).
2. Nhấp đúp vào **TCP/IP** -> tab **IP Addresses** -> cuộn xuống **IPAll**:
   - Xóa trống mục **TCP Dynamic Ports** (kể cả số `0`).
   - Điền **TCP Port** = `1433`.
3. Khởi động lại service **SQL Server** trong **SQL Server Services**.
4. Đảm bảo SQL Server hỗ trợ **SQL Server and Windows Authentication mode** (Mixed Mode Authentication).

### Bước 2.2: Chạy các file SQL trong SSMS theo thứ tự
Dùng tài khoản quản trị (**sa** hoặc **Windows Authentication**):
1. **`sql/01-quan-ly-sinh-vien.sql`**: Tạo Database `QuanLySinhVienDB` và bảng `dbo.SinhVien`.
2. **`sql/02-seed.sql`**: Nạp 2 sinh viên mẫu (`SV001` - Minh Nhật, `SV002` - Lan Anh).
3. **`sql/03-app-login.sql`**: Mở file, đổi placeholder `MAT_KHAU_LOCAL_CUA_BAN` thành mật khẩu thật mong muốn rồi thực thi để tạo login/user `sv_app` và cấp quyền tối thiểu `SELECT, INSERT`.
4. **`sql/04-lop-va-quan-he.sql`** *(Mở rộng)*: Tạo bảng `dbo.Lop`, đồng bộ dữ liệu `maLop` hiện có và tạo ràng buộc Foreign Key `SinhVien.maLop -> Lop.maLop`.

---

## 3. Cấu hình biến môi trường (.env)

Tạo hoặc cập nhật file `.env` ở thư mục gốc:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=1433
DB_NAME=QuanLySinhVienDB
DB_USER=sv_app
DB_PASSWORD=MAT_KHAU_LOCAL_CUA_BAN
DB_ENCRYPT=true
DB_TRUST_CERT=true
```

---

## 4. Các lệnh thực thi trong dự án

```bash
# 1. Biên dịch TypeScript sang JavaScript
pnpm build

# 2. Kiểm tra kết nối độc lập tới SQL Server
pnpm check:db

# 3. Chạy môi trường phát triển (Hot Reload với tsx)
pnpm dev

# 4. Chạy sản phẩm sau khi build
pnpm start

# 5. Kiểm tra quan hệ 1-N Lop - SinhVien (Mở rộng)
pnpm check:lop
```

---

## 5. Hợp đồng API (API Contracts)

| Method | Endpoint | Mô tả | Mã HTTP & Kết quả kỳ vọng |
|---|---|---|---|
| `GET` | `/` | Kiểm tra server | `200` - `{ success: true, message: "Backend quản lý sinh viên đang hoạt động" }` |
| `GET` | `/api/v1/sinh-vien` | Lấy danh sách | `200` - `{ success: true, message: "...", data: [...] }` |
| `GET` | `/api/v1/sinh-vien/:maSV` | Tìm theo mã | `200` nếu thấy; `404` nếu không tìm thấy (`success: false`) |
| `POST` | `/api/v1/sinh-vien` | Thêm mới | `201` nếu hợp lệ; `400` nếu sai dữ liệu; `409` nếu trùng mã |
| `GET` | `/khong-co` | Đường dẫn sai | `404` - `{ success: false, message: "Không tìm thấy đường dẫn" }` |

---

## 6. Trả lời các câu hỏi tự kiểm tra

1. **DTO và Model khác nhau thế nào?**
   - **DTO (Data Transfer Object)**: Định nghĩa cấu trúc dữ liệu trao đổi giữa Client và Server qua API (ở đây là 4 trường `maSV, hoTen, email, maLop` kiểu string). DTO không chứa logic truy xuất cơ sở dữ liệu.
   - **Model (Sequelize Model)**: Ánh xạ cấu trúc bảng trong CSDL quan hệ (`dbo.SinhVien`), định nghĩa kiểu dữ liệu cột, Primary Key, Foreign Key, cấu hình schema, và cung cấp các hàm truy vấn ORM (`findAll`, `findByPk`, `create`).

2. **Vì sao Controller cần `await` sau khi đổi Service?**
   - Khi Service chuyển sang truy vấn cơ sở dữ liệu qua Sequelize ORM, các thao tác I/O bất đồng bộ trả về một `Promise`. Nếu Controller không dùng `await`, dữ liệu trả về cho Client sẽ là một Promise rỗng (chưa được giải quyết), hoặc luồng thực thi chạy qua trước khi kết quả trả về, dẫn đến gửi response sai hoặc lỗi chưa kịp bắt.

3. **Vì sao restart server không dùng để reset test nữa?**
   - Ở bài trước, dữ liệu lưu trong mảng RAM nên khi tắt/bật lại server (restart) thì mảng bị khởi tạo lại từ đầu.
   - Ở buổi 4, dữ liệu được lưu bền vững (persistent) vào cơ sở dữ liệu SQL Server trên đĩa cứng. Khi server Node.js restart, CSDL vẫn giữ nguyên các bản ghi đã thêm (`SV003`, v.v.).

4. **Khóa chính (PK) bảo vệ trùng mã như thế nào?**
   - Khóa chính `PRIMARY KEY (maSV)` trên bảng `dbo.SinhVien` đảm bảo tính toàn vẹn dữ liệu ở tầng CSDL. Kể cả khi có hai request gửi đồng thời vượt qua bước kiểm tra `findByPk` ở tầng ứng dụng, CSDL vẫn ngăn chặn bản ghi thứ hai và ném lỗi `UniqueConstraintError`, được Service bắt và chuẩn hóa thành lỗi `409 Conflict`.

5. **Tại sao POST và GET phải đọc/ghi cùng nguồn dữ liệu?**
   - Đảm bảo tính nhất quán (Consistency): Khi Client thực hiện POST thêm mới thành công một sinh viên vào CSDL, các request GET tiếp theo phải đọc từ cùng CSDL đó mới có thể nhìn thấy dữ liệu vừa tạo.
