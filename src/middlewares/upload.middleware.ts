import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { AppError } from '../utils/AppError.js';

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB = 2,097,152 bytes
export const UPLOAD_DIR = path.resolve('public/uploads');

// Đảm bảo thư mục public/uploads tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['image/jpeg', 'image/png'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(mime)) {
    cb(new AppError(400, 'Chỉ chấp nhận file ảnh có định dạng JPEG hoặc PNG (.jpg, .jpeg, .png)'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Kiểm tra chữ ký (magic bytes) thực tế của file ảnh
 * Ngăn chặn giả mạo phần mở rộng (ví dụ đổi tên file .txt thành .png)
 */
export function verifyImageMagicBytes(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  if (bytesRead < 3) {
    return false;
  }

  // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytesRead >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // JPEG Magic bytes: FF D8 FF
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  return isPng || isJpeg;
}

/**
 * Xóa file an toàn không ném exception nếu file không tồn tại
 */
export function removeFileSafe(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`[UPLOAD] Không thể xóa file ${filePath}:`, err);
  }
}
