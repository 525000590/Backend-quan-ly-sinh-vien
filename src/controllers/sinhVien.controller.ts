import type { Request, Response, NextFunction } from 'express';
import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien,
  capNhatSinhVien as capNhatSinhVienService,
  xoaSinhVien as xoaSinhVienService,
} from '../services/sinhVien.service.js';

/**
 * Controller: Lấy danh sách toàn bộ sinh viên từ Database (có phân trang và tìm kiếm)
 */
export async function getDanhSachSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as { page?: number; limit?: number; search?: string };
    const { data, pagination } = await layDanhSachSinhVien(query);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách sinh viên thành công',
      data,
      pagination,
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

/**
 * Controller: Cập nhật thông tin sinh viên theo mã (PUT /:maSV)
 */
export async function capNhatSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maSV = String(req.params.maSV);
    const data = await capNhatSinhVienService(maSV, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật sinh viên thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Xóa sinh viên theo mã (DELETE /:maSV)
 */
export async function xoaSinhVien(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maSV = String(req.params.maSV);
    await xoaSinhVienService(maSV);
    res.status(200).json({
      success: true,
      message: 'Xóa sinh viên thành công',
    });
  } catch (error) {
    next(error);
  }
}
