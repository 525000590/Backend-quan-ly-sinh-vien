import type { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserAvatar,
} from '../services/auth.service.js';
import {
  verifyImageMagicBytes,
  removeFileSafe,
} from '../middlewares/upload.middleware.js';

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

/**
 * Controller: Cập nhật ảnh đại diện cá nhân (POST /api/auth/me/avatar)
 */
export async function uploadAvatarController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;

  try {
    // 1. Kiểm tra có gửi file hay không
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh đại diện',
        data: null,
      });
      return;
    }

    // 2. Kiểm tra chữ ký file thực tế (chống giả mạo đuôi file như .txt thành .png)
    const isValidImage = verifyImageMagicBytes(file.path);
    if (!isValidImage) {
      removeFileSafe(file.path);
      res.status(400).json({
        success: false,
        message: 'Nội dung file không phải là ảnh hợp lệ (chữ ký file không khớp)',
        data: null,
      });
      return;
    }

    // 3. Lấy userId từ req.user (tuyệt đối không tin req.body.userId)
    const userId = req.user?.sub;
    if (!userId) {
      removeFileSafe(file.path);
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực danh tính',
        data: null,
      });
      return;
    }

    const relativeAvatarUrl = `/uploads/${file.filename}`;

    // 4. Cập nhật đường dẫn avatar vào CSDL
    await updateUserAvatar(userId, relativeAvatarUrl);

    // 5. Trả phản hồi thành công 200
    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: {
        avatarUrl: relativeAvatarUrl,
      },
    });
  } catch (error) {
    // Nếu lỗi CSDL hoặc hệ thống, dọn dẹp file vừa tải lên để tránh file mồ côi
    if (file) {
      removeFileSafe(file.path);
    }
    next(error);
  }
}
