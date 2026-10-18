import 'dotenv/config';
import bcrypt from 'bcrypt';
import { User, sequelize } from '../models/index.js';

async function seedAdmin(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Kết nối CSDL thành công để seed Admin...');

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123';
    const adminFullName = 'Quản trị viên Hệ thống';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log(`Tài khoản Admin đã tồn tại: ${adminEmail} (Role: ${existingAdmin.role})`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const newAdmin = await User.create({
      fullName: adminFullName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });

    console.log(`✓ Đã tạo thành công tài khoản Admin:`);
    console.log(`- ID: ${newAdmin.id}`);
    console.log(`- Họ tên: ${newAdmin.fullName}`);
    console.log(`- Email: ${newAdmin.email}`);
    console.log(`- Role: ${newAdmin.role}`);
  } catch (error) {
    console.error('Lỗi khi seed Admin:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedAdmin();
