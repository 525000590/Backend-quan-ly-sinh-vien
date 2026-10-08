-- 1. Tạo SQL Server Login ở cấp độ Server (chạy trong master)
USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'sv_app')
BEGIN
    -- Lưu ý: Thay đổi 'MAT_KHAU_LOCAL_CUA_BAN' bằng mật khẩu local của bạn trước khi chạy
    CREATE LOGIN sv_app WITH PASSWORD = N'MAT_KHAU_LOCAL_CUA_BAN', CHECK_POLICY = OFF;
END
GO

-- 2. Tạo Database User và gán quyền trong QuanLySinhVienDB
USE QuanLySinhVienDB;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'sv_app')
BEGIN
    CREATE USER sv_app FOR LOGIN sv_app;
END
GO

-- 3. Cấp quyền SELECT, INSERT, UPDATE, DELETE trên các bảng cho sv_app
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.SinhVien TO sv_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Lop TO sv_app;
GO
