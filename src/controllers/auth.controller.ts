import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserProfile } from '../services/auth.service.js';

/**
 * Controller: Đăng ký tài khoản mới (POST /api/auth/register)
 */
export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Đăng nhập nhận Access Token (POST /api/auth/login)
 */
export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Xem thông tin hồ sơ cá nhân (GET /api/auth/profile)
 */
export async function profileController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực danh tính',
        data: null,
      });
      return;
    }

    const data = await getUserProfile(userId);
    res.status(200).json({
      success: true,
      message: 'Lấy thông tin hồ sơ thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}
