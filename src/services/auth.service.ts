import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { generateToken } from '../utils/jwt.js';

export interface UserResponseDTO {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * Đăng ký tài khoản mới:
 * - Kiểm tra trùng email (409)
 * - Băm mật khẩu bằng bcrypt cost 12
 * - Mặc định vai trò 'student'
 * - Trả thông tin User công khai, tuyệt đối không có password/passwordHash
 */
export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<UserResponseDTO> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError(409, 'Email đã được sử dụng');
  }

  // Hash mật khẩu với bcrypt salt rounds = 12
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'student',
    });

    return {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new AppError(409, 'Email đã được sử dụng');
    }
    throw error;
  }
}

/**
 * Đăng nhập:
 * - Kiểm tra email và password với bcrypt.compare
 * - Nếu sai trả 401 với thông điệp chung (bảo mật)
 * - Nếu đúng trả về JWT accessToken hết hạn sau 1 giờ (3600s)
 */
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<LoginResponseDTO> {
  const email = input.email.trim().toLowerCase();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác');
  }

  const accessToken = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
  };
}

/**
 * Lấy thông tin cá nhân (Profile) của người dùng đã xác thực
 */
export async function getUserProfile(userId: number | string): Promise<UserResponseDTO> {
  const user = await User.findByPk(Number(userId));
  if (!user) {
    throw new AppError(404, 'Không tìm thấy người dùng');
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}
