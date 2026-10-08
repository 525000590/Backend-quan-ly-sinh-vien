import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Error Middleware: Gom và chuẩn hóa toàn bộ phản hồi lỗi của hệ thống theo đặc tả OpenAPI.
 * Express nhận diện middleware xử lý lỗi khi có đủ đúng 4 tham số: (err, req, res, next).
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  // 1. Xử lý lỗi nghiệp vụ do ứng dụng chủ động ném ra (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  // 2. Xử lý lỗi định dạng JSON do express.json() parse thất bại (SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON gửi lên không đúng cú pháp',
      data: null,
    });
    return;
  }

  // 3. Xử lý các lỗi hệ thống hoặc lỗi chưa biết khác
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi ngoài dự kiến trên server',
    data: null,
  });
};
