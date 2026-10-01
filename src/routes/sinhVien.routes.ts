import { Router } from 'express';
import {
  getDanhSachSinhVien,
  getSinhVienTheoMa,
  taoSinhVien,
  deleteSinhVien,
} from '../controllers/sinhVien.controller.js';

const router = Router();

// GET /api/v1/sinh-vien -> Lấy danh sách sinh viên
router.get('/', getDanhSachSinhVien);

// GET /api/v1/sinh-vien/:maSV -> Tìm sinh viên theo mã
router.get('/:maSV', getSinhVienTheoMa);

// POST /api/v1/sinh-vien -> Thêm sinh viên mới
router.post('/', taoSinhVien);

// DELETE /api/v1/sinh-vien/:maSV -> Xóa sinh viên
router.delete('/:maSV', deleteSinhVien);

export default router;
