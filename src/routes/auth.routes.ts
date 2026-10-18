import { Router } from 'express';
import {
  registerController,
  loginController,
  profileController,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { isAuth } from '../middlewares/isAuth.js';
import { registerSchema, loginSchema } from '../validations/auth.schema.js';

const router = Router();

// POST /api/auth/register -> Đăng ký tài khoản (Public)
router.post('/register', validate(registerSchema), registerController);

// POST /api/auth/login -> Đăng nhập nhận JWT Token (Public)
router.post('/login', validate(loginSchema), loginController);

// GET /api/auth/profile -> Xem hồ sơ cá nhân (Cần Bearer Token)
router.get('/profile', isAuth, profileController);

export default router;
