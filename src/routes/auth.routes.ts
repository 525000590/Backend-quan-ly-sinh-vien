import { Router } from 'express';
import {
  registerController,
  loginController,
  profileController,
  uploadAvatarController,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { isAuth } from '../middlewares/isAuth.js';
import { upload } from '../middlewares/upload.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.schema.js';

const router = Router();

// POST /api/auth/register -> Đăng ký tài khoản (Public)
router.post('/register', validate(registerSchema), registerController);

// POST /api/auth/login -> Đăng nhập nhận JWT Token (Public)
router.post('/login', validate(loginSchema), loginController);

// GET /api/auth/profile -> Xem hồ sơ cá nhân (Cần Bearer Token)
router.get('/profile', isAuth, profileController);

// POST /api/auth/me/avatar -> Cập nhật ảnh đại diện cá nhân (Cần Bearer Token)
router.post('/me/avatar', isAuth, upload.single('avatar'), uploadAvatarController);

export default router;
