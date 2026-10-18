import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import sinhVienRoutes from './routes/sinhVien.routes.js';
import authRoutes from './routes/auth.routes.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { accessLogger } from './middlewares/access-log.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { sequelize } from './config/database.js';
import { swaggerSpec } from './config/swagger.config.js';

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

// 1. Ghi nhận log console mỗi request
app.use(loggerMiddleware);

// 2. Ghi nhật ký access.log bằng Morgan (chế độ append)
app.use(accessLogger);

// 3. Middleware bảo mật và CORS (tắt CSP để Swagger UI render giao diện mượt mà)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());

// 4. Phân tích cú pháp JSON trong request body
app.use(express.json());

// 5. Tuyến đường cơ bản kiểm tra server
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend quản lý sinh viên đang hoạt động',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  });
});

// 6. Tài liệu Swagger UI tại /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Gắn các tuyến đường API xác thực & tài khoản
app.use('/api/auth', authRoutes);

// 8. Gắn các tuyến đường API sinh viên
app.use('/api/v1/sinh-vien', sinhVienRoutes);

// 9. Xử lý đường dẫn không tồn tại (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy đường dẫn',
    data: null,
  });
});

// 10. Middleware gom và xử lý lỗi tập trung (phải đặt ở cuối cùng)
app.use(errorMiddleware);

// 11. Hàm khởi động server: Kết nối CSDL trước khi mở HTTP port
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
