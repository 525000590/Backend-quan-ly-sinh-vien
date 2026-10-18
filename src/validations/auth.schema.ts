import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Họ tên không được rỗng')
      .max(150, 'Họ tên không được quá 150 ký tự'),
    email: z
      .string()
      .trim()
      .email('Email không hợp lệ')
      .max(254, 'Email không được quá 254 ký tự'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(1, 'Mật khẩu không được rỗng'),
  })
  .strict();
