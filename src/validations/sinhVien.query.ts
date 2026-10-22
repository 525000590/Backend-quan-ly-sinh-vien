import { z } from 'zod';

export const sinhVienQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        // Kiểm tra strictly số nguyên dương (chỉ chứa chữ số 0-9)
        if (!/^\d+$/.test(val)) return false;
        const num = Number(val);
        return Number.isInteger(num) && num >= 1;
      },
      { message: 'Tham số page không hợp lệ, phải là số nguyên dương >= 1' }
    )
    .transform((val) => (val && val !== '' ? Number(val) : 1)),

  limit: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        if (!/^\d+$/.test(val)) return false;
        const num = Number(val);
        return Number.isInteger(num) && num >= 1 && num <= 50;
      },
      { message: 'Tham số limit không hợp lệ, phải là số nguyên từ 1 đến 50' }
    )
    .transform((val) => (val && val !== '' ? Number(val) : 10)),

  search: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val.trim() : ''))
    .refine((val) => val.length <= 80, {
      message: 'Từ khóa tìm kiếm không được vượt quá 80 ký tự',
    }),
});

export type SinhVienQueryParams = z.infer<typeof sinhVienQuerySchema>;
