import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import sinhVienRoutes from './routes/sinhVien.routes.js';
import authRoutes from './routes/auth.routes.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { accessLogger } from './middlewares/access-log.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { swaggerSpec } from './config/swagger.config.js';

const app = express();

// 1. Ghi nhận log console mỗi request
app.use(loggerMiddleware);

// 2. Ghi nhật ký access.log bằng Morgan (chế độ append)
app.use(accessLogger);

// 3. Middleware bảo mật Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cấu hình CORS cho phép Origin của Vite frontend (localhost:5173)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như curl, postman, mobile app) hoặc nằm trong danh sách cho phép
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Chặn bởi chính sách CORS: Origin không được phép'));
      }
    },
    credentials: true,
  })
);

// 4. Phân tích cú pháp JSON trong request body
app.use(express.json());

// Chuẩn hóa URL loại bỏ các dấu gạch chéo kép (ví dụ: //uploads -> /uploads)
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

// 5. Phục vụ ảnh tĩnh công khai từ thư mục public/uploads
app.use('/uploads', express.static(path.resolve('public/uploads')));

// 6. Tuyến đường cơ bản kiểm tra server
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

// 7. Tài liệu Swagger UI tại /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 8. Gắn các tuyến đường API xác thực & tài khoản
app.use('/api/auth', authRoutes);

// 9. Gắn các tuyến đường API sinh viên
app.use('/api/v1/sinh-vien', sinhVienRoutes);

// 10. Route mô phỏng lỗi 500 (chỉ bật trong môi trường test/development)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.get('/api/test-error-500', () => {
    throw new Error('Lỗi database mô phỏng: Connection lost');
  });
}

// 11. Xử lý đường dẫn không tồn tại (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Không tìm thấy đường dẫn',
    data: null,
  });
});

// 12. Middleware gom và xử lý lỗi tập trung (phải đặt ở cuối cùng)
app.use(errorMiddleware);

export { app };
export default app;
