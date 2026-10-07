import { sequelize } from '../config/database.js';

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('DB connected: QuanLySinhVienDB');
  } catch (error) {
    // Chẩn đoán lỗi mà không làm lộ chuỗi kết nối chứa mật khẩu
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Không thể kết nối đến SQL Server:', errorMessage);
    process.exitCode = 1;
  } finally {
    // Đóng kết nối sau khi kiểm tra xong để tiến trình kết thúc
    await sequelize.close();
  }
}

main();
