import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

/**
 * Error Middleware: Gom và chuẩn hóa toàn bộ phản hồi lỗi của hệ thống theo đặc tả OpenAPI.
 * Express nhận diện middleware xử lý lỗi khi có đủ đúng 4 tham số: (err, req, res, next).
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  // 0. Nếu headers đã được gửi, nhường quyền kiểm soát cho Express để tránh lỗi gửi 2 lần
  if (res.headersSent) {
    next(err);
    return;
  }

  const isDev = process.env.NODE_ENV === 'development';

  // 1. Xử lý lỗi nghiệp vụ do ứng dụng chủ động ném ra (AppError)
  if (err instanceof AppError) {
    const payload: Record<string, unknown> = {
      success: false,
      status: err.statusCode,
      message: err.message,
      data: null,
    };
    if (isDev && err.stack) {
      payload.stack = err.stack;
    }
    res.status(err.statusCode).json(payload);
    return;
  }

  // 2. Xử lý lỗi từ Multer (quá kích thước 2MB -> 413, sai field name -> 400)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        status: 413,
        message: 'Dung lượng file vượt quá giới hạn 2MB',
        data: null,
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        status: 400,
        message: 'Field file không hợp lệ, yêu cầu tên field là "avatar"',
        data: null,
      });
      return;
    }
    res.status(400).json({
      success: false,
      status: 400,
      message: `Lỗi upload file: ${err.message}`,
      data: null,
    });
    return;
  }

  // 3. Xử lý lỗi định dạng JSON do express.json() parse thất bại (SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      status: 400,
      message: 'Dữ liệu JSON gửi lên không đúng cú pháp',
      data: null,
    });
    return;
  }

  // 4. Xử lý các lỗi hệ thống hoặc lỗi chưa biết khác (HTTP 500)
  console.error('[SERVER ERROR]', err);

  const payload: Record<string, unknown> = {
    success: false,
    status: 500,
    message: isDev && err?.message ? err.message : 'Lỗi hệ thống, vui lòng thử lại sau',
    data: null,
  };

  if (isDev && err?.stack) {
    payload.stack = err.stack;
  }

  res.status(500).json(payload);
};
