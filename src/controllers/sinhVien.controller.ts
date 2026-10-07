import type { Request, Response, NextFunction } from 'express';
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien,
} from '../services/sinhVien.service.js';

/**
 * Controller: Lấy danh sách toàn bộ sinh viên từ Database
 */
export async function getDanhSachSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await layDanhSachSinhVien();
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách sinh viên thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Tìm kiếm sinh viên theo mã sinh viên (maSV)
 */
export async function getSinhVienTheoMa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maSV = String(req.params.maSV);
    const data = await timSinhVienTheoMa(maSV);

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tìm sinh viên thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Thêm mới một sinh viên vào Database
 */
export async function taoSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await themSinhVien(req.body);
    res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}
