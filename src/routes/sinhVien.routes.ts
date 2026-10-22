import { Router } from 'express';
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  capNhatSinhVien,
  xoaSinhVien,
} from '../controllers/sinhVien.controller.js';
import { validate, validateQuery } from '../middlewares/validate.middleware.js';
import { isAuth } from '../middlewares/isAuth.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import {
  createSinhVienSchema,
  updateSinhVienSchema,
} from '../validations/sinhVien.schema.js';
import { sinhVienQuerySchema } from '../validations/sinhVien.query.js';

const router = Router();

// GET /api/v1/sinh-vien -> Lấy danh sách sinh viên (Public, có phân trang & tìm kiếm)
router.get('/', validateQuery(sinhVienQuerySchema), getDanhSachSinhVien);

// GET /api/v1/sinh-vien/:maSV -> Tìm sinh viên theo mã (Public)
router.get('/:maSV', getSinhVienTheoMa);

// POST /api/v1/sinh-vien -> Thêm sinh viên mới (Yêu cầu đăng nhập quyền Admin + Validation)
router.post(
  '/',
  isAuth,
  isAdmin,
  validate(createSinhVienSchema),
  taoSinhVien
);

// PUT /api/v1/sinh-vien/:maSV -> Cập nhật thông tin sinh viên (Yêu cầu đăng nhập quyền Admin + Validation)
router.put(
  '/:maSV',
  isAuth,
  isAdmin,
  validate(updateSinhVienSchema),
  capNhatSinhVien
);

// DELETE /api/v1/sinh-vien/:maSV -> Xóa sinh viên (Yêu cầu đăng nhập quyền Admin)
router.delete(
  '/:maSV',
  isAuth,
  isAdmin,
  xoaSinhVien
);

export default router;
