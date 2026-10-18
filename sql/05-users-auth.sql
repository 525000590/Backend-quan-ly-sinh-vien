USE QuanLySinhVienDB;
GO

-- 1. Tạo bảng dbo.Users nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) NOT NULL,
        fullName NVARCHAR(150) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'student',
        CONSTRAINT PK_Users PRIMARY KEY (id),
        CONSTRAINT UQ_Users_Email UNIQUE (email)
    );
END
GO

-- 2. Cấp quyền truy cập bảng Users cho sv_app
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Users TO sv_app;
GO
