import type { Request, Response, NextFunction } from 'express';
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien,
  xoaSinhVien,
} from '../services/sinhVien.service.js';

/**
 * Controller: Lấy danh sách toàn bộ sinh viên
 */
export function getDanhSachSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const data = layDanhSachSinhVien();
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
 * Controller: Tìm kiếm sinh viên theo mã (maSV)
 */
export function getSinhVienTheoMa(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const maSV = String(req.params.maSV);
    const sinhVien = timSinhVienTheoMa(maSV);

    if (!sinhVien) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tìm sinh viên thành công',
      data: sinhVien,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Thêm mới một sinh viên
 */
export function taoSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const sinhVienMoi = themSinhVien(req.body);
    res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công',
      data: sinhVienMoi,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Xóa sinh viên theo mã (maSV)
 */
export function deleteSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const maSV = String(req.params.maSV);
    const daXoa = xoaSinhVien(maSV);

    if (!daXoa) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên để xóa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa sinh viên thành công',
    });
  } catch (error) {
    next(error);
  }
}
