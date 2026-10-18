import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { User, SinhVien, sequelize } from '../models/index.js';

const BASE_URL = 'http://localhost:5000';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('====================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ 24 CA BUỔI 07 (A01 - B12)   ');
  console.log('====================================================');

  await sequelize.authenticate();

  // Chuẩn bị môi trường: Xóa sinh viên test và user test nếu có
  await SinhVien.destroy({ where: { maSV: ['SV098', 'SV099'] } });
  await User.destroy({ where: { email: ['student.test@example.com', 'a01.test@example.com'] } });

  // Đợi server sẵn sàng
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch {
      await wait(1000);
    }
  }

  if (!serverReady) {
    console.error('Lỗi: Server chưa chạy tại ' + BASE_URL);
    process.exit(1);
  }

  console.log('✓ Kết nối server thành công.\n');

  // ==========================================
  // PHẦN 1: BẢNG TEST A01 - A12 (AUTH & JWT)
  // ==========================================
  console.log('--- KIỂM THỬ BẢNG A: REGISTER, LOGIN & JWT ---');

  // A01: Register email mới hợp lệ -> 201
  const resA01 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sinh Viên Test',
      email: 'student.test@example.com',
      password: 'Student@123',
    }),
  });
  const dataA01 = await resA01.json();
  console.log(`A01: Register email mới -> Status: ${resA01.status} (Expected 201), role: ${dataA01.data?.role}`);
  if (resA01.status !== 201 || dataA01.data?.role !== 'student' || dataA01.data?.passwordHash) {
    throw new Error('A01 FAILED');
  }

  // A02: Register trùng email A01 -> 409
  const resA02 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sinh Viên Test',
      email: 'student.test@example.com',
      password: 'Student@123',
    }),
  });
  console.log(`A02: Register trùng email -> Status: ${resA02.status} (Expected 409)`);
  if (resA02.status !== 409) throw new Error('A02 FAILED');

  // A03: Register body thêm role=admin -> 400
  const resA03 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Hacker',
      email: 'hacker@example.com',
      password: 'Hacker@123',
      role: 'admin',
    }),
  });
  console.log(`A03: Register có role lạ -> Status: ${resA03.status} (Expected 400)`);
  if (resA03.status !== 400) throw new Error('A03 FAILED');

  // A04: Register thiếu password / email sai -> 400
  const resA04 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Lỗi',
      email: 'khong-phai-email',
    }),
  });
  console.log(`A04: Register thiếu password & email sai -> Status: ${resA04.status} (Expected 400)`);
  if (resA04.status !== 400) throw new Error('A04 FAILED');

  // A05: Login đúng tài khoản student -> 200 + accessToken
  const resA05 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student.test@example.com',
      password: 'Student@123',
    }),
  });
  const dataA05 = await resA05.json();
  const studentToken = dataA05.data?.accessToken;
  console.log(`A05: Login student đúng -> Status: ${resA05.status} (Expected 200), token nhận được: ${studentToken ? 'Hợp lệ' : 'Thiếu'}`);
  if (resA05.status !== 200 || !studentToken) throw new Error('A05 FAILED');

  // A06: Login sai password -> 401
  const resA06 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student.test@example.com',
      password: 'SaiMatKhau@123',
    }),
  });
  console.log(`A06: Login sai mật khẩu -> Status: ${resA06.status} (Expected 401)`);
  if (resA06.status !== 401) throw new Error('A06 FAILED');

  // A07: Login email không tồn tại -> 401
  const resA07 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'khongtontai@example.com',
      password: 'AnyPassword@123',
    }),
  });
  console.log(`A07: Login email không tồn tại -> Status: ${resA07.status} (Expected 401)`);
  if (resA07.status !== 401) throw new Error('A07 FAILED');

  // A08: GET /api/auth/profile không có token -> 401
  const resA08 = await fetch(`${BASE_URL}/api/auth/profile`);
  console.log(`A08: Profile không token -> Status: ${resA08.status} (Expected 401)`);
  if (resA08.status !== 401) throw new Error('A08 FAILED');

  // A09: Profile với token bị sửa 1 ký tự -> 401
  const fakeToken = studentToken.slice(0, -4) + 'abcd';
  const resA09 = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${fakeToken}` },
  });
  console.log(`A09: Profile token sai chữ ký -> Status: ${resA09.status} (Expected 401)`);
  if (resA09.status !== 401) throw new Error('A09 FAILED');

  // A10: Profile với JWT student hợp lệ -> 200
  const resA10 = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const dataA10 = await resA10.json();
  console.log(`A10: Profile JWT hợp lệ -> Status: ${resA10.status} (Expected 200), email: ${dataA10.data?.email}`);
  if (resA10.status !== 200 || dataA10.data?.email !== 'student.test@example.com') throw new Error('A10 FAILED');

  // A11: Token hết hạn gọi Profile -> 401
  const secret = process.env.JWT_SECRET!;
  const expiredToken = jwt.sign(
    { sub: String(dataA10.data.id), role: 'student' },
    secret,
    { expiresIn: '0s', algorithm: 'HS256' }
  );
  await wait(50);
  const resA11 = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  console.log(`A11: Token hết hạn -> Status: ${resA11.status} (Expected 401)`);
  if (resA11.status !== 401) throw new Error('A11 FAILED');

  // A12: Kiểm tra SQL Server lưu password dạng hash
  const dbUser = await User.findOne({ where: { email: 'student.test@example.com' } });
  const isHashValid = dbUser?.passwordHash.startsWith('$2b$12$');
  console.log(`A12: SQL Server hash bcrypt cost 12 -> ${isHashValid ? 'PASS' : 'FAIL'} (${dbUser?.passwordHash.slice(0, 15)}...)`);
  if (!isHashValid) throw new Error('A12 FAILED');

  console.log('✓ BẢNG A ĐẠT 100% (12/12 CA PASS)\n');

  // Lấy Admin Token
  const resAdminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'Admin@123',
    }),
  });
  const dataAdminLogin = await resAdminLogin.json();
  const adminToken = dataAdminLogin.data?.accessToken;
  if (!adminToken) throw new Error('Không lấy được adminToken để chạy Bảng B');

  // ==========================================
  // PHẦN 2: BẢNG TEST B01 - B12 (PHÂN QUYỀN SINH VIÊN)
  // ==========================================
  console.log('--- KIỂM THỬ BẢNG B: PHÂN QUYỀN TRÊN SINH VIÊN ---');

  // B01: GET danh sách không cần JWT -> 200
  const resB01 = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
  console.log(`B01: GET danh sách (Public) -> Status: ${resB01.status} (Expected 200)`);
  if (resB01.status !== 200) throw new Error('B01 FAILED');

  // B02: POST SinhVien không có JWT -> 401
  const resB02 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV098',
      hoTen: 'Sinh Vien Khong Auth',
      email: 'noauth@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`B02: POST không JWT -> Status: ${resB02.status} (Expected 401)`);
  if (resB02.status !== 401) throw new Error('B02 FAILED');

  // B03: PUT SinhVien token không hợp lệ -> 401
  const resB03 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV098`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sai-token',
    },
    body: JSON.stringify({
      hoTen: 'Cap Nhat',
      email: 'update@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`B03: PUT token sai -> Status: ${resB03.status} (Expected 401)`);
  if (resB03.status !== 401) throw new Error('B03 FAILED');

  // B04: DELETE SinhVien với JWT student -> 403
  const resB04 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`B04: DELETE với JWT student -> Status: ${resB04.status} (Expected 403)`);
  if (resB04.status !== 403) throw new Error('B04 FAILED');

  // B05: POST SinhVien với JWT student -> 403
  const resB05 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      maSV: 'SV098',
      hoTen: 'Sinh Vien Student Role',
      email: 'studentrole@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`B05: POST với JWT student -> Status: ${resB05.status} (Expected 403)`);
  if (resB05.status !== 403) throw new Error('B05 FAILED');

  // B06: PUT SinhVien với JWT student -> 403
  const resB06 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      hoTen: 'Sửa Lan Anh',
      email: 'lananh.edit@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`B06: PUT với JWT student -> Status: ${resB06.status} (Expected 403)`);
  if (resB06.status !== 403) throw new Error('B06 FAILED');

  // B07: POST SinhVien hợp lệ với JWT admin -> 201
  const resB07 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      maSV: 'SV098',
      hoTen: 'Nguyễn Văn Admin Test',
      email: 'admintest@example.com',
      maLop: '25CT114',
    }),
  });
  const dataB07 = await resB07.json();
  console.log(`B07: POST với JWT admin -> Status: ${resB07.status} (Expected 201), maSV: ${dataB07.data?.maSV}`);
  if (resB07.status !== 201 || dataB07.data?.maSV !== 'SV098') throw new Error('B07 FAILED');

  // B08: PUT SinhVien hợp lệ với JWT admin -> 200
  const resB08 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV098`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      hoTen: 'Nguyễn Văn Admin Updated',
      email: 'admin.updated@example.com',
      maLop: '25CT114',
    }),
  });
  const dataB08 = await resB08.json();
  console.log(`B08: PUT với JWT admin -> Status: ${resB08.status} (Expected 200), hoTen: ${dataB08.data?.hoTen}`);
  if (resB08.status !== 200 || dataB08.data?.hoTen !== 'Nguyễn Văn Admin Updated') throw new Error('B08 FAILED');

  // B09: DELETE SinhVien với JWT admin -> 200
  const resB09 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV098`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`B09: DELETE với JWT admin -> Status: ${resB09.status} (Expected 200)`);
  if (resB09.status !== 200) throw new Error('B09 FAILED');

  // Xác nhận sau xóa bằng GET -> 404
  const checkDel = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV098`);
  console.log(`Xác nhận sau B09: GET SV098 -> Status: ${checkDel.status} (Expected 404)`);
  if (checkDel.status !== 404) throw new Error('Xác nhận sau B09 FAILED');

  // B10: Admin POST body sai Zod -> 400
  const resB10 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      maSV: 'SV099',
      email: 'khong-phai-email',
      maLop: '25CT114',
    }),
  });
  const dataB10 = await resB10.json();
  console.log(`B10: Admin POST body sai Zod -> Status: ${resB10.status} (Expected 400), errors:`, dataB10.errors);
  if (resB10.status !== 400 || !dataB10.errors) throw new Error('B10 FAILED');

  // B11: Admin POST mã bị trùng -> 409
  const resB11 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      maSV: 'SV001',
      hoTen: 'Trùng SV001',
      email: 'trung@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`B11: Admin POST trùng maSV -> Status: ${resB11.status} (Expected 409)`);
  if (resB11.status !== 409) throw new Error('B11 FAILED');

  // B12: DELETE cùng mã lần thứ 2 bằng Admin -> 404
  const resB12 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV098`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`B12: Admin DELETE mã không tồn tại -> Status: ${resB12.status} (Expected 404)`);
  if (resB12.status !== 404) throw new Error('B12 FAILED');

  console.log('✓ BẢNG B ĐẠT 100% (12/12 CA PASS)\n');
  console.log('🎉 TỔNG KẾT: TOÀN BỘ 24 CA TEST BUỔI 07 ĐÃ VƯỢT QUA XUẤT SẮC! 🎉');

  await sequelize.close();
}

runTests().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
