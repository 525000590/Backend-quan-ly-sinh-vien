USE QuanLySinhVienDB;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
  THROW 50001, N'Chưa có bảng dbo.Users', 1;
GO

IF COL_LENGTH('dbo.Users', 'avatarUrl') IS NULL
BEGIN
  ALTER TABLE dbo.Users
  ADD avatarUrl NVARCHAR(255) NULL;
END;
GO

SELECT TOP (10) id, email, avatarUrl FROM dbo.Users;
GO
