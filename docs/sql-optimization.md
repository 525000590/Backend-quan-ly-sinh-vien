# Phân Tích & Tối Ưu Hóa Truy Vấn SQL Server – Chapter 09

**Dự án**: `backend-quan-ly-sinh-vien`  
**Cơ sở dữ liệu**: Microsoft SQL Server 2014 Express / Standard  
**Bảng thực tế**: `dbo.SinhVien`, `dbo.Users`, `dbo.Lop`  
**Mục tiêu**: Phân tích kế hoạch thực thi (Execution Plan), đo lường mức tiêu thụ tài nguyên phần cứng (Logical Reads, CPU Time, Elapsed Time) bằng `SET STATISTICS IO/TIME ON`, và đánh giá các đề xuất tối ưu hóa truy vấn phân trang & tìm kiếm.

---

## 1. Phương pháp đo lường & Câu truy vấn kiểm nghiệm

### Câu lệnh đo lường trong SSMS / Database:
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Truy vấn phân trang và tìm kiếm theo tên sinh viên:
SELECT maSV, hoTen, email, maLop
FROM dbo.SinhVien
WHERE hoTen LIKE N'%Anh%'
ORDER BY maSV ASC
OFFSET 0 ROWS FETCH NEXT 2 ROWS ONLY;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

---

## 2. Báo cáo so sánh trước và sau tối ưu

| Chỉ tiêu đo lường | Phiên bản gốc (Chưa tối ưu) | Phiên bản đề xuất (Tối ưu) | Ghi chú & Đánh giá |
|---|:---:|:---:|---|
| **Số dòng trả về** | 2 dòng (`SV002`, `SV003`) | 2 dòng (`SV002`, `SV003`) | Đúng chính xác hợp đồng phân trang `limit=2` |
| **Kết quả và thứ tự** | `SV002` (Lan Anh) → `SV003` (Hoàng Anh) | `SV002` (Lan Anh) → `SV003` (Hoàng Anh) | Thứ tự bảo toàn 100% theo `maSV ASC` |
| **SQL Server CPU Time** | ~ 0 ms | ~ 0 ms | Thời gian xử lý CPU tức thì trên tập dữ liệu lab |
| **Elapsed Time (Thời gian chạy)** | ~ 1 ms | ~ 1 ms | Thời gian thực thi toàn phần cực nhanh |
| **Logical Reads (Số trang đọc)** | 1 logical read (bảng `SinhVien`) | 1 logical read (bảng `SinhVien`) | Toàn bộ bảng nằm gọn trong 1 data page 8KB |
| **Execution Plan (Toán tử chính)** | Clustered Index Scan → Filter → Top (Offset/Fetch) | Clustered Index Scan → Filter → Top (Offset/Fetch) | Do điều kiện `LIKE '%Anh%'` có ký tự wildcard đầu chuỗi |
| **Kết quả có giống nhau?** | **Mốc chuẩn** | **Có (Khớp 100%)** | Dữ liệu và metadata không thay đổi |

---

## 3. Bảng phân tích đề xuất của AI và phản biện kỹ thuật

| Nhận định | Phân tích kỹ thuật & Bằng chứng thực tế |
|---|---|
| **Điểm có thể chậm** | 1. Điều kiện tìm kiếm `hoTen LIKE N'%Anh%'` có ký tự đại diện `%` ở đầu chuỗi (leading wildcard). Bất kỳ B-Tree Index thông thường nào trên cột `hoTen` cũng không thể thực hiện thao tác **Index Seek** mà bắt buộc phải duyệt qua toàn bộ các dòng (**Index Scan / Table Scan**).<br>2. Sắp xếp `ORDER BY maSV ASC` dựa trên khóa chính `maSV` (Clustered Index), do đó SQL Server không tốn thêm toán tử `Sort` phụ (tránh được việc cấp phát bộ nhớ Sort Memory Grant). |
| **Đề xuất từ AI** | - **Đề xuất 1 (Chấp nhận)**: Giữ nguyên `ORDER BY maSV` và cú pháp `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY` ở tầng Database thay vì tải hết dữ liệu lên Node.js rồi `.slice()`.<br>- **Đề xuất 2 (Phản biện / Từ chối thêm Index bừa bãi)**: AI đề xuất thêm Non-clustered Index trên `hoTen`. Phản biện: Do tìm kiếm `LIKE '%...%'` hai đầu, Non-clustered Index vẫn phải Scan index; với bảng dữ liệu nhỏ hoặc số lượng sinh viên vừa phải, việc thêm index sẽ làm tăng chi phí ghi đĩa khi `INSERT/UPDATE/DELETE` sinh viên mà không cải thiện tốc độ `LIKE '%Anh%'`. Nếu muốn tìm kiếm văn bản quy mô lớn trong production, giải pháp chuẩn của SQL Server là **Full-Text Search (FTS)** hoặc Elasticsearch. |
| **Kiểm chứng dữ liệu** | - Số lượng sinh viên kiểm thử: 5 bản ghi thử nghiệm trong CSDL.<br>- Kết quả truy vấn trả về đúng 2 sinh viên có tên chứa "Anh" (`SV002` và `SV003`).<br>- Logical Reads = 1 trang đĩa, không có hiện tượng nghẽn I/O. |
| **Kết luận thực tiễn** | Với tập dữ liệu nhỏ (5–10 dòng), thời gian thực thi ở mức mili-giây không có sự khác biệt lớn. Tuy nhiên, việc áp dụng phân trang tại Database (`findAndCountAll` với `OFFSET/FETCH`) bảo đảm hệ thống sẵn sàng xử lý khi dữ liệu tăng lên hàng chục ngàn bản ghi, ngăn chặn hoàn toàn nguy cơ cạn kiệt bộ nhớ RAM của máy chủ Node.js. |

---

## 4. Truy vấn thống kê mở rộng (GROUP BY maLop)

Truy vấn đối chiếu thực tế:
```sql
SELECT maLop, COUNT(*) AS totalStudents
FROM dbo.SinhVien
GROUP BY maLop
ORDER BY maLop ASC;
```
- **Kết quả thực tế trong CSDL**:
  - `maLop`: `25CT114` — `totalStudents`: 5.
- **Kế hoạch thực thi**: SQL Server sử dụng toán tử **Stream Aggregate** kết hợp Clustered Index, tốc độ xử lý tức thì, chi phí I/O tối thiểu (1 logical read).
