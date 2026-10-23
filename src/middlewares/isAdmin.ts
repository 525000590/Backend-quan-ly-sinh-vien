import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware isAdmin: Kiểm tra quyền Admin dựa trên thông tin req.user đã được isAuth xác minh.
 * - Thiếu req.user -> 401
 * - req.user.role !== 'admin' -> 403 Forbidden
 * - req.user.role === 'admin' -> next()
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      status: 401,
      message: 'Chưa xác thực danh tính',
      data: null,
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      status: 403,
      message: 'Quyền truy cập bị từ chối: Yêu cầu vai trò Admin',
      data: null,
    });
    return;
  }

  next();
};
