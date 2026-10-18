import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET chưa được cấu hình hoặc rỗng trong biến môi trường!');
  }
  return secret;
};

export interface JwtUserPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Ký và tạo JWT Access Token (hết hạn 1 giờ, thuật toán HS256)
 */
export function generateToken(user: { id: number | string; role: string }): string {
  const secret = getJwtSecret();
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    secret,
    { expiresIn: '1h', algorithm: 'HS256' }
  );
}

/**
 * Xác minh JWT token, kiểm tra chữ ký và thời hạn
 */
export function verifyToken(token: string): JwtUserPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
  }) as JwtUserPayload;
}
