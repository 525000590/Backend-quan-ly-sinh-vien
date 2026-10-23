import 'dotenv/config';
import { app } from './app.js';
import { sequelize } from './config/database.js';

const PORT = Number(process.env.PORT ?? 5000);

// Khởi động server: Xác thực kết nối CSDL SQL Server trước khi mở HTTP port
async function start(): Promise<void> {
  try {
    // Xác thực kết nối tới SQL Server
    await sequelize.authenticate();
    console.log('Kết nối CSDL SQL Server thành công!');

    // Khởi động server lắng nghe trên cổng đã chỉ định
    app.listen(PORT, () => {
      console.log(`Server đang lắng nghe tại http://localhost:${PORT}`);
      console.log(`Tài liệu Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Khởi động thất bại] Không thể kết nối CSDL:', errorMsg);
    try {
      await sequelize.close();
    } catch {
      // bỏ qua lỗi đóng kết nối nếu có
    }
    process.exit(1);
  }
}

start();
