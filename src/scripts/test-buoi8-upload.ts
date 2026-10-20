import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { sequelize } from '../config/database.js';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Sample valid PNG (1x1 transparent PNG)
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]);

// Sample valid minimal JPEG
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08,
  0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a,
  0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d,
  0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22,
  0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
  0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0,
  0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
  0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3f, 0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

async function runTests() {
  console.log('====================================================');
  console.log('   BẮT ĐẦU CHẠY KIỂM THỬ 12 CA UPLOAD (U01 - U12)    ');
  console.log('====================================================');

  await sequelize.authenticate();
  console.log('✓ Kết nối CSDL SQL Server thành công.');

  // Thiết lập tài khoản test Student A và Student B
  let studentA = await User.findOne({ where: { email: 'student.a@example.com' } });
  if (!studentA) {
    studentA = await User.create({
      fullName: 'Student A Test',
      email: 'student.a@example.com',
      passwordHash: '$2b$12$DummyHashForTestingStudentA1234567890123456',
      role: 'student',
      avatarUrl: null,
    });
  } else {
    studentA.avatarUrl = null;
    await studentA.save();
  }

  let studentB = await User.findOne({ where: { email: 'student.b@example.com' } });
  if (!studentB) {
    studentB = await User.create({
      fullName: 'Student B Test',
      email: 'student.b@example.com',
      passwordHash: '$2b$12$DummyHashForTestingStudentB1234567890123456',
      role: 'student',
      avatarUrl: null,
    });
  } else {
    studentB.avatarUrl = null;
    await studentB.save();
  }

  const tokenA = generateToken({ id: studentA.id, role: studentA.role });
  const tokenB = generateToken({ id: studentB.id, role: studentB.role });

  let passed = 0;
  let failed = 0;

  function countFilesInUploads(): number {
    const dir = path.resolve('public/uploads');
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter((f) => f !== '.gitkeep').length;
  }

  // --- U01: Avatar PNG hợp lệ + Student JWT ---
  {
    const beforeCount = countFilesInUploads();
    const formData = new FormData();
    formData.append('avatar', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'test-avatar.png');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const body: any = await res.json();
    const afterCount = countFilesInUploads();

    await studentA.reload();
    const isSuccess =
      res.status === 200 &&
      body.success === true &&
      body.data?.avatarUrl &&
      studentA.avatarUrl === body.data.avatarUrl &&
      afterCount === beforeCount + 1;

    if (isSuccess) {
      console.log(`U01: Avatar PNG hợp lệ + Student JWT -> PASS (Status: 200, URL: ${body.data.avatarUrl})`);
      passed++;
    } else {
      console.error(`U01: FAIL (Status: ${res.status}, body:`, body);
      failed++;
    }
  }

  // --- U02: Avatar JPEG hợp lệ + Student JWT -> Ảnh trình duyệt mở được ---
  {
    const formData = new FormData();
    formData.append('avatar', new Blob([VALID_JPEG_BUFFER], { type: 'image/jpeg' }), 'avatar2.jpg');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const body: any = await res.json();

    let canAccessFile = false;
    if (res.status === 200 && body.data?.avatarUrl) {
      const fileRes = await fetch(`${BASE_URL}${body.data.avatarUrl}`);
      canAccessFile = fileRes.status === 200;
    }

    if (res.status === 200 && canAccessFile) {
      console.log(`U02: Avatar JPEG hợp lệ + Trình duyệt mở được file tĩnh -> PASS (Status: 200)`);
      passed++;
    } else {
      console.error(`U02: FAIL (Status: ${res.status}, fileAccessible: ${canAccessFile})`);
      failed++;
    }
  }

  // --- U03: Không có Authorization -> 401, không sinh file và không UPDATE ---
  {
    const beforeCount = countFilesInUploads();
    const formData = new FormData();
    formData.append('avatar', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'test-noauth.png');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 401 && afterCount === beforeCount) {
      console.log(`U03: Không có Authorization -> PASS (Status: 401, không sinh file rác)`);
      passed++;
    } else {
      console.error(`U03: FAIL (Status: ${res.status}, before: ${beforeCount}, after: ${afterCount})`);
      failed++;
    }
  }

  // --- U04: JWT sai/hết hạn -> 401, không có URL mới ---
  {
    const beforeCount = countFilesInUploads();
    const formData = new FormData();
    formData.append('avatar', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'test-badjwt.png');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer bad.token.here` },
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 401 && afterCount === beforeCount) {
      console.log(`U04: JWT sai chữ ký -> PASS (Status: 401, không tạo file)`);
      passed++;
    } else {
      console.error(`U04: FAIL (Status: ${res.status})`);
      failed++;
    }
  }

  // --- U05: Body thiếu file -> 400, không cập nhật SQL ---
  {
    const formData = new FormData();
    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });

    if (res.status === 400) {
      console.log(`U05: Body thiếu file -> PASS (Status: 400)`);
      passed++;
    } else {
      console.error(`U05: FAIL (Status: ${res.status})`);
      failed++;
    }
  }

  // --- U06: Field photo thay vì avatar -> 400, bị từ chối ---
  {
    const beforeCount = countFilesInUploads();
    const formData = new FormData();
    formData.append('photo', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'test.png');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 400 && afterCount === beforeCount) {
      console.log(`U06: Field photo thay vì avatar -> PASS (Status: 400, không ghi file)`);
      passed++;
    } else {
      console.error(`U06: FAIL (Status: ${res.status})`);
      failed++;
    }
  }

  // --- U07: Kích thước > 2MB -> 413 LIMIT_FILE_SIZE, không file rác ---
  {
    const beforeCount = countFilesInUploads();
    // Tạo buffer dung lượng 2.2MB = 2.2 * 1024 * 1024 bytes
    const largeBuffer = Buffer.alloc(2.2 * 1024 * 1024, 0);
    // Gán magic bytes JPEG ở đầu
    VALID_JPEG_BUFFER.copy(largeBuffer, 0, 0, 10);

    const formData = new FormData();
    formData.append('avatar', new Blob([largeBuffer], { type: 'image/jpeg' }), 'large.jpg');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 413 && afterCount === beforeCount) {
      console.log(`U07: Kích thước > 2MB -> PASS (Status: 413, không để lại file rác)`);
      passed++;
    } else {
      console.error(`U07: FAIL (Status: ${res.status}, before: ${beforeCount}, after: ${afterCount})`);
      failed++;
    }
  }

  // --- U08: TXT đổi tên thành avatar.png -> 400, kiểm chữ ký file thực ---
  {
    const beforeCount = countFilesInUploads();
    const fakePng = Buffer.from('Hello world this is not a png file at all! Just pure text.');
    const formData = new FormData();
    formData.append('avatar', new Blob([fakePng], { type: 'image/png' }), 'fake.png');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 400 && afterCount === beforeCount) {
      console.log(`U08: File văn bản đổi tên .png -> PASS (Status: 400, phát hiện sai chữ ký và dọn file)`);
      passed++;
    } else {
      console.error(`U08: FAIL (Status: ${res.status}, before: ${beforeCount}, after: ${afterCount})`);
      failed++;
    }
  }

  // --- U09: Đuôi .gif / MIME không chấp nhận -> 400 ---
  {
    const beforeCount = countFilesInUploads();
    const gifBuffer = Buffer.from('GIF89a...');
    const formData = new FormData();
    formData.append('avatar', new Blob([gifBuffer], { type: 'image/gif' }), 'animation.gif');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });
    const afterCount = countFilesInUploads();

    if (res.status === 400 && afterCount === beforeCount) {
      console.log(`U09: File GIF không được chấp nhận -> PASS (Status: 400, chặn đuôi lạ)`);
      passed++;
    } else {
      console.error(`U09: FAIL (Status: ${res.status})`);
      failed++;
    }
  }

  // --- U10: Upload hai lần cùng tài khoản -> 200, URL mới ---
  {
    const formData1 = new FormData();
    formData1.append('avatar', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'first.png');
    const res1 = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData1,
    });
    const b1: any = await res1.json();

    const formData2 = new FormData();
    formData2.append('avatar', new Blob([VALID_JPEG_BUFFER], { type: 'image/jpeg' }), 'second.jpg');
    const res2 = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData2,
    });
    const b2: any = await res2.json();

    if (res1.status === 200 && res2.status === 200 && b1.data?.avatarUrl !== b2.data?.avatarUrl) {
      console.log(`U10: Upload hai lần cùng tài khoản -> PASS (Status: 200, URL mới không ghi đè bất ngờ)`);
      passed++;
    } else {
      console.error(`U10: FAIL (b1: ${b1.data?.avatarUrl}, b2: ${b2.data?.avatarUrl})`);
      failed++;
    }
  }

  // --- U11: Student A gửi userId của B trong body -> chỉ A đổi avatar, avatar của B không đổi ---
  {
    await studentB.reload();
    const avatarBBefore = studentB.avatarUrl;

    const formData = new FormData();
    formData.append('avatar', new Blob([VALID_PNG_BUFFER], { type: 'image/png' }), 'attack.png');
    formData.append('userId', String(studentB.id));

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: formData,
    });

    await studentA.reload();
    await studentB.reload();

    const bSafe = studentB.avatarUrl === avatarBBefore;
    if ((res.status === 200 || res.status === 400) && bSafe) {
      console.log(`U11: Student A gửi userId của B trong body -> PASS (Bảo vệ an toàn, avatar B không bị sửa chéo)`);
      passed++;
    } else {
      console.error(`U11: FAIL (bSafe: ${bSafe}, status: ${res.status})`);
      failed++;
    }
  }

  // --- U12: GET Profile trả avatarUrl, URL giữ nguyên ---
  {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body: any = await res.json();

    if (res.status === 200 && body.data?.avatarUrl === studentA.avatarUrl && body.data?.avatarUrl !== null) {
      console.log(`U12: GET Profile trả về avatarUrl hợp lệ -> PASS (URL: ${body.data.avatarUrl})`);
      passed++;
    } else {
      console.error(`U12: FAIL (Status: ${res.status}, body:`, body);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`KẾT QUẢ: ${passed}/12 ca PASS, ${failed} ca FAIL.`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ 12 CA KIỂM THỬ UPLOAD ĐÃ VƯỢT QUA XUẤT SẮC! 🎉');
  }
  console.log('====================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
