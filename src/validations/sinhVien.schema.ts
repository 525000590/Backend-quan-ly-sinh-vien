import { z } from 'zod';

const editableFields = {
  hoTen: z
    .string()
    .trim()
    .min(1, 'Họ tên không được rỗng')
    .max(150, 'Họ tên không được vượt quá 150 ký tự'),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .max(254, 'Email không được vượt quá 254 ký tự'),
  maLop: z
    .string()
    .trim()
    .min(1, 'Mã lớp không được rỗng')
    .max(50, 'Mã lớp không được vượt quá 50 ký tự'),
};

export const createSinhVienSchema = z
  .object({
    maSV: z
      .string()
      .trim()
      .min(1, 'Mã SV không được rỗng')
      .max(5, 'Mã SV không được vượt quá 5 ký tự'),
    ...editableFields,
  })
  .strict();

export const updateSinhVienSchema = z
  .object({
    ...editableFields,
  })
  .strict();
