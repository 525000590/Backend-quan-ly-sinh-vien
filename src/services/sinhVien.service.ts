import { UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';
import { SinhVien } from '../models/SinhVien.js';
import { Lop } from '../models/Lop.js';
import { AppError } from '../utils/AppError.js';

/**
 * Lấy toàn bộ danh sách sinh viên từ CSDL SQL Server, sắp xếp theo maSV tăng dần
 */
export async function layDanhSachSinhVien(): Promise<ISinhVienDTO[]> {
  const danhSach = await SinhVien.findAll({
    order: [['maSV', 'ASC']],
  });

  return danhSach.map((sv) => ({
    maSV: sv.maSV,
    hoTen: sv.hoTen,
    email: sv.email,
    maLop: sv.maLop,
  }));
}

/**
 * Tìm sinh viên theo mã sinh viên (maSV)
 * Trả về ISinhVienDTO nếu tìm thấy, hoặc undefined nếu không có
 */
export async function timSinhVienTheoMa(
  maSV: string
): Promise<ISinhVienDTO | undefined> {
  const sinhVien = await SinhVien.findByPk(maSV);
  if (!sinhVien) {
    return undefined;
  }

  return {
    maSV: sinhVien.maSV,
    hoTen: sinhVien.hoTen,
    email: sinhVien.email,
    maLop: sinhVien.maLop,
  };
}

/**
 * Thêm sinh viên mới vào SQL Server với đầy đủ kiểm tra (validation) nghiệp vụ
 */
export async function themSinhVien(input: unknown): Promise<ISinhVienDTO> {
  // 1. Kiểm tra input phải là một đối tượng JSON hợp lệ
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new AppError(400, 'Dữ liệu gửi lên phải là một đối tượng JSON hợp lệ');
  }

  const raw = input as Record<string, unknown>;

  // 2. Kiểm tra bắt buộc có đủ 4 trường và đều phải là kiểu chuỗi (string)
  if (
    typeof raw.maSV !== 'string' ||
    typeof raw.hoTen !== 'string' ||
    typeof raw.email !== 'string' ||
    typeof raw.maLop !== 'string'
  ) {
    throw new AppError(
      400,
      'Các trường maSV, hoTen, email, maLop là bắt buộc và phải là kiểu chuỗi (string)'
    );
  }

  // 3. Chuẩn hóa chuỗi (loại bỏ khoảng trắng 2 đầu)
  const maSV = raw.maSV.trim();
  const hoTen = raw.hoTen.trim();
  const email = raw.email.trim();
  const maLop = raw.maLop.trim();

  // 4. Kiểm tra định dạng maSV: phải có dạng SV kèm đúng 3 chữ số (ví dụ: SV003)
  const maSVRegex = /^SV[0-9]{3}$/;
  if (!maSVRegex.test(maSV)) {
    throw new AppError(
      400,
      'Mã sinh viên không hợp lệ. Định dạng yêu cầu là SV kèm 3 chữ số (ví dụ: SV003)'
    );
  }

  // 5. Kiểm tra hoTen và maLop không được rỗng sau khi trim
  if (hoTen.length === 0 || maLop.length === 0) {
    throw new AppError(400, 'Họ tên và mã lớp không được để trống');
  }

  // 6. Kiểm tra giới hạn độ dài ký tự
  if (hoTen.length > 150) {
    throw new AppError(400, 'Họ tên không được vượt quá 150 ký tự');
  }
  if (email.length > 254) {
    throw new AppError(400, 'Email không được vượt quá 254 ký tự');
  }
  if (maLop.length > 50) {
    throw new AppError(400, 'Mã lớp không được vượt quá 50 ký tự');
  }

  // 7. Kiểm tra định dạng email cơ bản
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'Email không đúng định dạng');
  }

  // 8. Kiểm tra maSV đã tồn tại chưa
  const svDaTonTai = await SinhVien.findByPk(maSV);
  if (svDaTonTai) {
    throw new AppError(409, 'Mã sinh viên đã tồn tại');
  }

  // 9. Kiểm tra mã lớp tồn tại nếu có bảng Lop
  try {
    const lopTonTai = await Lop.findByPk(maLop);
    if (!lopTonTai) {
      throw new AppError(400, 'Mã lớp không tồn tại');
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
  }

  // 10. Lưu sinh viên vào CSDL SQL Server
  try {
    const sinhVienMoi = await SinhVien.create({
      maSV,
      hoTen,
      email,
      maLop,
    });

    return {
      maSV: sinhVienMoi.maSV,
      hoTen: sinhVienMoi.hoTen,
      email: sinhVienMoi.email,
      maLop: sinhVienMoi.maLop,
    };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new AppError(409, 'Mã sinh viên đã tồn tại');
    }
    if (error instanceof ForeignKeyConstraintError) {
      throw new AppError(400, 'Mã lớp không tồn tại');
    }
    throw error;
  }
}

/**
 * Cập nhật thông tin sinh viên theo mã sinh viên (PUT /api/v1/sinh-vien/:maSV)
 * Body chỉ gồm hoTen, email, maLop (không cho phép đổi maSV qua body)
 */
export async function capNhatSinhVien(
  maSV: string,
  input: unknown
): Promise<ISinhVienDTO> {
  // 1. Kiểm tra input phải là đối tượng JSON hợp lệ
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new AppError(400, 'Dữ liệu gửi lên phải là một đối tượng JSON hợp lệ');
  }

  const raw = input as Record<string, unknown>;

  // 2. Kiểm tra bắt buộc đủ 3 trường: hoTen, email, maLop kiểu chuỗi
  if (
    typeof raw.hoTen !== 'string' ||
    typeof raw.email !== 'string' ||
    typeof raw.maLop !== 'string'
  ) {
    throw new AppError(
      400,
      'Các trường hoTen, email, maLop là bắt buộc và phải là kiểu chuỗi (string)'
    );
  }

  // 3. Chuẩn hóa chuỗi (trim)
  const hoTen = raw.hoTen.trim();
  const email = raw.email.trim();
  const maLop = raw.maLop.trim();

  // 4. Kiểm tra chuỗi không được để trống sau khi trim
  if (hoTen.length === 0 || maLop.length === 0) {
    throw new AppError(400, 'Họ tên và mã lớp không được để trống');
  }

  // 5. Kiểm tra giới hạn độ dài ký tự
  if (hoTen.length > 150) {
    throw new AppError(400, 'Họ tên không được vượt quá 150 ký tự');
  }
  if (email.length > 254) {
    throw new AppError(400, 'Email không được vượt quá 254 ký tự');
  }
  if (maLop.length > 50) {
    throw new AppError(400, 'Mã lớp không được vượt quá 50 ký tự');
  }

  // 6. Kiểm tra định dạng email cơ bản
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'Email không đúng định dạng');
  }

  // 7. Tìm sinh viên hiện có trong CSDL
  const sinhVien = await SinhVien.findByPk(maSV);
  if (!sinhVien) {
    throw new AppError(404, 'Không tìm thấy sinh viên');
  }

  // 8. Kiểm tra mã lớp tồn tại nếu có bảng Lop
  try {
    const lopTonTai = await Lop.findByPk(maLop);
    if (!lopTonTai) {
      throw new AppError(400, 'Mã lớp không tồn tại');
    }
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
  }

  // 9. Cập nhật dữ liệu vào SQL Server
  try {
    await sinhVien.update({
      hoTen,
      email,
      maLop,
    });

    return {
      maSV: sinhVien.maSV,
      hoTen: sinhVien.hoTen,
      email: sinhVien.email,
      maLop: sinhVien.maLop,
    };
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw new AppError(400, 'Mã lớp không tồn tại');
    }
    throw error;
  }
}

/**
 * Xóa sinh viên theo mã sinh viên (DELETE /api/v1/sinh-vien/:maSV)
 */
export async function xoaSinhVien(maSV: string): Promise<boolean> {
  const sinhVien = await SinhVien.findByPk(maSV);
  if (!sinhVien) {
    throw new AppError(404, 'Không tìm thấy sinh viên');
  }

  await sinhVien.destroy();
  return true;
}
