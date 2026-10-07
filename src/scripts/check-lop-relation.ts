import { SinhVien, Lop, sequelize } from '../models/index.js';

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Đang kiểm tra quan hệ Lớp 1-N Sinh Viên...');

    const sinhViens = await SinhVien.findAll({
      include: [
        {
          model: Lop,
          as: 'lop',
        },
      ],
      order: [['maSV', 'ASC']],
    });

    console.log('Kết quả findAll kèm Lop:');
    console.log(JSON.stringify(sinhViens, null, 2));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Lỗi kiểm tra quan hệ Lớp - Sinh Viên:', errorMsg);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
