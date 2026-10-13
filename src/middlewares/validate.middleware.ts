import type { RequestHandler } from 'express';
import type { z } from 'zod';

export const validate = (schema: z.ZodType): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        data: null,
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      });
      return; // Dừng: không đi vào Controller
    }

    req.body = parsed.data; // Dùng dữ liệu đã chuẩn hóa (trim)
    next(); // Hợp lệ: tiếp tục xử lý
  };
};
