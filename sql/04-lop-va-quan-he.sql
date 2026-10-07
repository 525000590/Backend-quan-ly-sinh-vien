USE QuanLySinhVienDB;
GO

-- 1. Tạo bảng dbo.Lop nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Lop]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Lop (
        maLop NVARCHAR(50) NOT NULL,
        tenLop NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_Lop PRIMARY KEY (maLop)
    );
END
GO

-- 2. Seed dữ liệu cho dbo.Lop từ tất cả các maLop DISTINCT hiện có trong dbo.SinhVien
INSERT INTO dbo.Lop (maLop, tenLop)
SELECT DISTINCT sv.maLop, sv.maLop AS tenLop
FROM dbo.SinhVien sv
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Lop l WHERE l.maLop = sv.maLop
);
GO

-- 3. Thêm Foreign Key từ SinhVien.maLop -> Lop.maLop nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_SinhVien_Lop]') AND parent_object_id = OBJECT_ID(N'[dbo].[SinhVien]'))
BEGIN
    ALTER TABLE dbo.SinhVien
    ADD CONSTRAINT FK_SinhVien_Lop FOREIGN KEY (maLop)
    REFERENCES dbo.Lop (maLop);
END
GO

-- 4. Cấp quyền SELECT trên bảng Lop cho sv_app
GRANT SELECT ON dbo.Lop TO sv_app;
GO
