import { Router } from 'express';
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  capNhatSinhVien,
  xoaSinhVien,
} from '../controllers/sinhVien.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createSinhVienSchema,
  updateSinhVienSchema,
} from '../validations/sinhVien.schema.js';

const router = Router();

// GET /api/v1/sinh-vien -> Lấy danh sách sinh viên
router.get('/', getDanhSachSinhVien);

// GET /api/v1/sinh-vien/:maSV -> Tìm sinh viên theo mã
router.get('/:maSV', getSinhVienTheoMa);

// POST /api/v1/sinh-vien -> Thêm sinh viên mới (qua validation)
router.post('/', validate(createSinhVienSchema), taoSinhVien);

// PUT /api/v1/sinh-vien/:maSV -> Cập nhật thông tin sinh viên (qua validation)
router.put('/:maSV', validate(updateSinhVienSchema), capNhatSinhVien);

// DELETE /api/v1/sinh-vien/:maSV -> Xóa sinh viên
router.delete('/:maSV', xoaSinhVien);

export default router;
