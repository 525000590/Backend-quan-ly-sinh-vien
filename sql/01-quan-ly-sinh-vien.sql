-- Tạo Database QuanLySinhVienDB và bảng dbo.SinhVien
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySinhVienDB')
BEGIN
    CREATE DATABASE QuanLySinhVienDB;
END
GO

USE QuanLySinhVienDB;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SinhVien]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.SinhVien (
        maSV VARCHAR(5) NOT NULL,
        hoTen NVARCHAR(150) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        maLop NVARCHAR(50) NOT NULL,
        CONSTRAINT PK_SinhVien PRIMARY KEY (maSV)
    );
END
GO
