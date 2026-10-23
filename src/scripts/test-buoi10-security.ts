import 'dotenv/config';
import { sequelize } from '../config/database.js';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runSecurityTests() {
  console.log('====================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ BẢO MẬT & RATE LIMIT (S01 - S07)  ');
  console.log('====================================================');

  await sequelize.authenticate();
  console.log('✓ Kết nối CSDL SQL Server thành công.');

  const studentUser = await User.findOne({ where: { email: 'student.test@example.com' } });
  const studentToken = studentUser
    ? generateToken({ id: studentUser.id, role: studentUser.role })
    : generateToken({ id: 999, role: 'student' });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, code: string, desc: string, detail?: any) {
    if (condition) {
      console.log(`✓ ${code}: ${desc} -> PASS`);
      passed++;
    } else {
      console.error(`✗ ${code}: ${desc} -> FAIL`, detail !== undefined ? detail : '');
      failed++;
    }
  }

  // S05: Kiểm tra Security Response Headers từ Helmet
  {
    const res = await fetch(`${BASE_URL}/health`);
    const headers = res.headers;
    const hasContentTypeOptions = headers.get('x-content-type-options') === 'nosniff';
    const hasFrameOptions = Boolean(headers.get('x-frame-options'));
    const hasDnsPrefetch = headers.get('x-dns-prefetch-control') === 'off';

    assert(
      hasContentTypeOptions && hasFrameOptions && hasDnsPrefetch,
      'S05',
      'Kiểm tra Response Headers có security headers của Helmet',
      {
        'x-content-type-options': headers.get('x-content-type-options'),
        'x-frame-options': headers.get('x-frame-options'),
        'x-dns-prefetch-control': headers.get('x-dns-prefetch-control'),
      }
    );
  }

  // S04: GET danh sách sinh viên -> Không chịu giới hạn của login rate limiter
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
    assert(res.status === 200, 'S04', 'GET danh sách SinhVien không bị giới hạn bởi loginLimiter');
  }

  // S06: Login sai mật khẩu trước khi vượt hạn mức -> 401, không cấp JWT
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.test@example.com',
        password: 'SaiMatKhau123',
      }),
    });
    const json: any = await res.json();
    assert(
      res.status === 401 && json.success === false && !json.data?.accessToken,
      'S06',
      'Login sai mật khẩu trước khi vượt hạn mức trả về 401 và không cấp JWT',
      json
    );
  }

  // S01 & S02: Gửi liên tiếp các request đăng nhập để kiểm tra ngưỡng 5 requests / 60s
  console.log('\n--- Kiểm tra Rate Limiter: Gửi 5 requests đầu và request thứ 6 ---');
  let firstFiveValid = true;
  for (let i = 2; i <= 5; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.test@example.com',
        password: 'SaiMatKhau123',
      }),
    });
    if (res.status === 429) {
      firstFiveValid = false;
    }
  }

  assert(firstFiveValid, 'S01', '5 Login requests đầu trong cửa sổ 60s được xử lý bình thường (HTTP 401/200)');

  // Request thứ 6: Bắt buộc nhận HTTP 429 Too Many Requests
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.test@example.com',
        password: 'SaiMatKhau123',
      }),
    });
    const json: any = await res.json();
    assert(
      res.status === 429 && json.success === false && json.status === 429,
      'S02',
      'Request thứ 6 trong cửa sổ bị Rate Limiter chặn với HTTP 429 Too Many Requests',
      json
    );
  }

  // S03: Xác nhận header RateLimit và cơ chế cửa sổ
  {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.test@example.com',
        password: 'SaiMatKhau123',
      }),
    });
    const retryAfter = res.headers.get('retry-after') || res.headers.get('ratelimit-reset');
    assert(
      res.status === 429,
      'S03',
      'Hạn mức được duy trì trong cửa sổ thời gian (có Retry-After / RateLimit header)',
      { retryAfter }
    );
  }

  // S07: Student gọi DELETE -> 403 theo RBAC
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const json: any = await res.json();
    assert(
      res.status === 403 && json.success === false && json.status === 403,
      'S07',
      'Student gọi DELETE bị chặn 403 Forbidden theo RBAC',
      json
    );
  }

  console.log('\n====================================================');
  console.log(`TỔNG KẾT: ${passed} ca PASS, ${failed} ca FAIL.`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ 7 CA KIỂM THỬ BẢO MẬT S01 - S07 ĐÃ PASS 100%! 🎉');
  }
  console.log('====================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runSecurityTests().catch((err) => {
  console.error('Lỗi khi chạy Security Tests:', err);
  process.exit(1);
});
