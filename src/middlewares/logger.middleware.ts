import type { Request, Response, NextFunction } from 'express';

/**
 * Logger Middleware: ghi nhận method và URL của mỗi request gửi tới server.
 * Không ghi log các thông tin nhạy cảm hoặc body.
 */
export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[LOG] ${req.method} ${req.path}`);
  }
  next();
}
