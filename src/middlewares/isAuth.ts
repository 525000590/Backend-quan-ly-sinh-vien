import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware isAuth: Kiểm tra và xác minh Bearer JWT Token từ header Authorization.
 * - Thiếu header, sai Bearer, token rỗng -> 401
 * - Token sai chữ ký, hết hạn -> 401
 * - Hợp lệ -> gán req.user và gọi next()
 */
export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Chưa xác thực hoặc thiếu Bearer Token',
      data: null,
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token không được để trống',
      data: null,
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
      data: null,
    });
    return;
  }
};
