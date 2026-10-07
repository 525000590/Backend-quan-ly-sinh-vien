USE QuanLySinhVienDB;
GO

-- Seed dữ liệu mẫu: chỉ INSERT các mã chưa tồn tại để khi chạy lại không bị lỗi trùng
IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV001')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV001', N'Minh Nhật', 'minhnhat@example.com', '25CT114');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SinhVien WHERE maSV = 'SV002')
BEGIN
    INSERT INTO dbo.SinhVien (maSV, hoTen, email, maLop)
    VALUES ('SV002', N'Lan Anh', 'lananh@example.com', '25CT114');
END
GO

-- Kiểm tra kết quả
SELECT maSV, hoTen, email, maLop
FROM dbo.SinhVien
ORDER BY maSV ASC;
GO
