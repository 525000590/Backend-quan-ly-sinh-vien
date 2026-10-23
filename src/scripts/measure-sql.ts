import 'dotenv/config';
import { sequelize } from '../config/database.js';

async function measureSQL() {
  await sequelize.authenticate();
  console.log('--- ĐO LƯỜNG SQL SERVER THẬT VỚI STATISTICS IO VÀ TIME ---');

  // Truy vấn 1: Phân trang và tìm kiếm theo tên
  console.log('\n[1] Truy vấn: Tìm kiếm theo họ tên có "Anh", ORDER BY maSV, OFFSET 0 FETCH 2');
  const [results1] = await sequelize.query(`
    SET STATISTICS IO ON;
    SET STATISTICS TIME ON;

    SELECT maSV, hoTen, email, maLop
    FROM dbo.SinhVien
    WHERE hoTen LIKE N'%Anh%'
    ORDER BY maSV ASC
    OFFSET 0 ROWS FETCH NEXT 2 ROWS ONLY;

    SET STATISTICS IO OFF;
    SET STATISTICS TIME OFF;
  `);
  console.log('Kết quả trả về:', results1);

  // Truy vấn 2: Đếm tổng số bản ghi thỏa điều kiện search
  console.log('\n[2] Truy vấn COUNT(*) theo search hoTen LIKE N"%Anh%"');
  const [results2] = await sequelize.query(`
    SELECT COUNT(*) AS totalItems
    FROM dbo.SinhVien
    WHERE hoTen LIKE N'%Anh%';
  `);
  console.log('Kết quả count:', results2);

  // Truy vấn 3: Thống kê số lượng sinh viên theo từng lớp (GROUP BY)
  console.log('\n[3] Truy vấn GROUP BY maLop');
  const [results3] = await sequelize.query(`
    SELECT maLop, COUNT(*) AS totalStudents
    FROM dbo.SinhVien
    GROUP BY maLop
    ORDER BY maLop ASC;
  `);
  console.log('Kết quả Group By:', results3);

  await sequelize.close();
}

measureSQL().catch(console.error);
