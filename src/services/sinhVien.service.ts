import type { ISinhVienDTO } from '../dtos/sinhVien.dto.js';
import { AppError } from '../utils/AppError.js';

// Mảng lưu trữ danh sách sinh viên trong bộ nhớ (in-memory)
const sinhVienList: ISinhVienDTO[] = [
  {
    maSV: 'SV001',
    hoTen: 'Minh Nhật',
    email: 'minhnhat@example.com',
    maLop: '25CT114',
  },
  {
    maSV: 'SV002',
    hoTen: 'Lan Anh',
    email: 'lananh@example.com',
    maLop: '25CT114',
  },
];

/**
 * Lấy toàn bộ danh sách sinh viên
 */
export function layDanhSachSinhVien(): ISinhVienDTO[] {
  return [...sinhVienList];
}

/**
 * Tìm sinh viên theo mã sinh viên
 */
export function timSinhVienTheoMa(maSV: string): ISinhVienDTO | undefined {
  return sinhVienList.find((sv) => sv.maSV === maSV);
}

/**
 * Thêm sinh viên mới với các quy tắc kiểm tra (validation)
 */
export function themSinhVien(input: unknown): ISinhVienDTO {
  // 1. Kiểm tra input phải là một object hợp lệ (không phải null, array hoặc kiểu nguyên thủy)
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

  // 6. Kiểm tra định dạng email cơ bản
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'Email không đúng định dạng');
  }

  // 7. Kiểm tra trùng mã sinh viên
  const daTonTai = sinhVienList.some((sv) => sv.maSV === maSV);
  if (daTonTai) {
    throw new AppError(409, 'Mã sinh viên đã tồn tại');
  }

  // 8. Tạo đối tượng sinh viên mới chỉ lưu đúng 4 trường theo DTO (bỏ các trường thừa ngoài ý muốn)
  const sinhVienMoi: ISinhVienDTO = {
    maSV,
    hoTen,
    email,
    maLop,
  };

  sinhVienList.push(sinhVienMoi);
  return sinhVienMoi;
}

/**
 * Xóa sinh viên theo mã sinh viên (maSV)
 */
export function xoaSinhVien(maSV: string): boolean {
  const index = sinhVienList.findIndex((sv) => sv.maSV === maSV);
  if (index === -1) {
    return false;
  }
  sinhVienList.splice(index, 1);
  return true;
}
