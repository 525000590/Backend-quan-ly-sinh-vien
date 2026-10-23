import { rateLimit } from 'express-rate-limit';

/**
 * Middleware giới hạn tần suất gọi API Đăng nhập (POST /api/auth/login)
 * Quy định bài thực hành: Tối đa 5 requests trong 60 giây từ cùng một IP/Client.
 * Khi vượt hạn mức trả về HTTP 429 Too Many Requests theo hợp đồng lỗi thống nhất.
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // Cửa sổ thời gian 60 giây (1 phút)
  limit: 5, // Tối đa 5 request trong cửa sổ 60s
  standardHeaders: 'draft-7', // Trả về headers tiêu chuẩn RateLimit-*
  legacyHeaders: false, // Tắt các headers cũ X-RateLimit-*
  message: {
    success: false,
    status: 429,
    message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau',
    data: null,
  },
  // Sử dụng handler tùy chỉnh để đảm bảo mã HTTP 429 và format response JSON nhất quán
  handler: (req, res, _next, options) => {
    res.status(429).json(options.message);
  },
});
