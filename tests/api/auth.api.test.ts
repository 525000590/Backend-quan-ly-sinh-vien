import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { User } from '../../src/models/user.model.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('API Test: Xác thực và Hồ sơ cá nhân với Supertest (A01 - A07)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 10,
    fullName: 'Lê Văn Cường',
    email: 'cuong.test@example.com',
    passwordHash: '$2b$12$mockHashedPassword1234567890',
    role: 'student',
    avatarUrl: null,
  };

  // A01: Login hợp lệ -> 200, Token được cấp
  test('A01: Login hợp lệ -> HTTP 200 và cấp Access Token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cuong.test@example.com',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.expiresIn).toBe(3600);
  });

  // A02: Sai mật khẩu -> 401, không có JWT
  test('A02: Đăng nhập sai mật khẩu -> HTTP 401 và không có JWT Token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cuong.test@example.com',
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body?.data?.accessToken).toBeUndefined();
  });

  // A03: User không tồn tại -> 401, không có JWT
  test('A03: Tài khoản không tồn tại -> HTTP 401 và không có JWT Token', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent.user@example.com',
        password: 'AnyPassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(401);
    expect(res.body.data).toBeNull();
  });

  // A04: Thiếu trường bắt buộc -> 400, thông báo Validation
  test('A04: Body thiếu password hoặc sai định dạng email -> HTTP 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-valid-email-format',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(400);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBeDefined();
  });

  // A05: GET Profile không có JWT -> 401, request bị chặn
  test('A05: GET /api/auth/profile không gửi Token -> HTTP 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(401);
    expect(res.body.data).toBeNull();
  });

  // A06: GET Profile có JWT hợp lệ -> 200, trả đúng dữ liệu được phép
  test('A06: GET /api/auth/profile với Bearer Token hợp lệ -> HTTP 200 và dữ liệu hồ sơ', async () => {
    const validToken = generateToken({ id: mockUser.id, role: mockUser.role });
    jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any);

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(mockUser.id);
    expect(res.body.data.email).toBe(mockUser.email);
    expect(res.body.data.role).toBe(mockUser.role);
    // Tuyệt đối không để lộ mật khẩu trong profile
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();
  });

  // A07: Lỗi hệ thống giả lập -> 500, không lộ SQL / secret
  test('A07: Lỗi hệ thống 500 -> HTTP 500 an toàn, không lộ secret', async () => {
    const res = await request(app).get('/api/test-error-500');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe(500);
    expect(res.body.data).toBeNull();

    const responseText = JSON.stringify(res.body);
    expect(responseText).not.toContain('passwordHash');
    expect(responseText).not.toContain('JWT_SECRET');
  });
});
