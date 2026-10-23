import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/user.model.js';
import { loginUser } from '../../src/services/auth.service.js';
import { loginSchema } from '../../src/validations/auth.schema.js';
import { AppError } from '../../src/utils/AppError.js';

describe('Unit Test: Logic Đăng Nhập (T01 - T05)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T01: Tài khoản có, mật khẩu đúng -> Xác thực thành công, tạo Token
  test('T01: Tài khoản tồn tại, mật khẩu đúng -> Đăng nhập thành công và cấp Access Token', async () => {
    // Arrange: User giả lập, bcrypt.compare trả về true
    const mockUser = {
      id: 1,
      fullName: 'Nguyễn Văn A',
      email: 'student@example.com',
      passwordHash: '$2b$12$mockHashedPassword1234567890',
      role: 'student',
    };
    const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
    const compareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    // Act: Gọi hàm Login của auth service
    const result = await loginUser({
      email: 'student@example.com',
      password: 'CorrectPassword123',
    });

    // Assert: Đối chiếu kết quả và hành vi gọi
    expect(findOneSpy).toHaveBeenCalledWith({ where: { email: 'student@example.com' } });
    expect(compareSpy).toHaveBeenCalledWith('CorrectPassword123', mockUser.passwordHash);
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(3600);
    expect(typeof result.accessToken).toBe('string');
    expect(result.accessToken.length).toBeGreaterThan(20);
  });

  // T02: Tài khoản có, mật khẩu sai -> Từ chối, không tạo Token
  test('T02: Tài khoản tồn tại nhưng mật khẩu sai -> Ném lỗi 401 và không cấp Token', async () => {
    // Arrange: User giả lập, bcrypt.compare trả về false
    const mockUser = {
      id: 2,
      fullName: 'Trần Văn B',
      email: 'student.b@example.com',
      passwordHash: '$2b$12$mockHashedPassword1234567890',
      role: 'student',
    };
    jest.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    // Act & Assert
    await expect(
      loginUser({
        email: 'student.b@example.com',
        password: 'WrongPassword',
      })
    ).rejects.toThrow(AppError);

    await expect(
      loginUser({
        email: 'student.b@example.com',
        password: 'WrongPassword',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác',
    });
  });

  // T03: Tài khoản không tồn tại -> Từ chối, không tạo Token
  test('T03: Tài khoản không tồn tại trong CSDL -> Ném lỗi 401 và không gọi bcrypt hay cấp Token', async () => {
    // Arrange: User.findOne trả về null
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    // Act & Assert
    await expect(
      loginUser({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      })
    ).rejects.toThrow(AppError);

    await expect(
      loginUser({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Email hoặc mật khẩu không chính xác',
    });

    // Không tồn tại user thì không được so sánh mật khẩu
    expect(compareSpy).not.toHaveBeenCalled();
  });

  // T04: Thiếu email hoặc password -> Validation từ chối input (loginSchema)
  test('T04: Dữ liệu đầu vào thiếu trường hoặc sai định dạng -> Bị Zod schema từ chối (400)', () => {
    // Trường hợp 1: Thiếu password
    const result1 = loginSchema.safeParse({ email: 'student@example.com' });
    expect(result1.success).toBe(false);

    // Trường hợp 2: Email sai định dạng
    const result2 = loginSchema.safeParse({ email: 'not-an-email', password: 'Password123' });
    expect(result2.success).toBe(false);

    // Trường hợp 3: Rỗng hoàn toàn
    const result3 = loginSchema.safeParse({});
    expect(result3.success).toBe(false);

    // Trường hợp 4: Hợp lệ
    const result4 = loginSchema.safeParse({ email: 'student@example.com', password: 'ValidPassword123' });
    expect(result4.success).toBe(true);
  });

  // T05: Lỗi Database / logic xác thực -> Xử lý an toàn, không lộ dữ liệu nội bộ
  test('T05: Lỗi kết nối CSDL đột ngột -> Ngoại lệ được propagate an toàn, không cấp Token', async () => {
    // Arrange: User.findOne ném lỗi kết nối CSDL
    const dbError = new Error('Database connection failed: Connection lost');
    jest.spyOn(User, 'findOne').mockRejectedValue(dbError);

    // Act & Assert
    await expect(
      loginUser({
        email: 'student@example.com',
        password: 'Password123',
      })
    ).rejects.toThrow('Database connection failed: Connection lost');
  });
});
