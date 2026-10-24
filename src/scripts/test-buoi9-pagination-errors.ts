import 'dotenv/config';
import { sequelize } from '../config/database.js';
import { SinhVien } from '../models/SinhVien.js';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('====================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ CHƯƠNG 08: PHÂN TRANG & XỬ LÝ LỖI   ');
  console.log('====================================================');

  await sequelize.authenticate();
  console.log('✓ Kết nối CSDL SQL Server thành công.');

  // Tự động kiểm tra và khởi động server nếu người dùng chưa bật pnpm dev
  let internalServer: any = null;
  try {
    await fetch(`${BASE_URL}/health`);
  } catch {
    console.log(`ℹ Server chưa khởi động sẵn, đang tự động khởi chạy trên cổng ${PORT}...`);
    const { app } = await import('../app.js');
    await new Promise<void>((resolve) => {
      internalServer = app.listen(Number(PORT), () => resolve());
    });
    console.log('✓ Server test đã sẵn sàng.');
  }

  // Đảm bảo có ít nhất 5 sinh viên test với tên có 'Anh'
  const countSV = await SinhVien.count();
  if (countSV < 5) {
    console.log('Đang chuẩn bị dữ liệu test sinh viên...');
    const seedData = [
      { maSV: 'SV001', hoTen: 'Minh Nhật', email: 'minhnhat@example.com', maLop: '25CT114' },
      { maSV: 'SV002', hoTen: 'Lan Anh', email: 'lananh@example.com', maLop: '25CT114' },
      { maSV: 'SV003', hoTen: 'Hoàng Anh', email: 'hoanganh@example.com', maLop: '25CT114' },
      { maSV: 'SV004', hoTen: 'Trần Tuấn', email: 'trantuan@example.com', maLop: '25CT114' },
      { maSV: 'SV006', hoTen: 'Nguyễn Minh An Updated', email: 'an.updated@example.com', maLop: '25CT114' },
    ];
    for (const sv of seedData) {
      await SinhVien.findOrCreate({ where: { maSV: sv.maSV }, defaults: sv });
    }
  }

  // Lấy hoặc tạo tài khoản test
  let admin = await User.findOne({ where: { email: 'admin@example.com' } });
  let student = await User.findOne({ where: { email: 'student.test@example.com' } });

  const adminToken = admin ? generateToken({ id: admin.id, role: 'admin' }) : '';
  const studentToken = student ? generateToken({ id: student.id, role: 'student' }) : '';

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

  console.log('\n--- PHẦN A: LAB 1 - PAGINATION & SEARCH (P01 - P17) ---');

  // P01: GET /api/v1/sinh-vien mặc định
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      json.success === true &&
      Array.isArray(json.data) &&
      json.pagination?.page === 1 &&
      json.pagination?.limit === 10,
      'P01',
      'GET danh sách mặc định page=1, limit=10',
      json
    );
  }

  // P02: GET ?page=1&limit=2
  let p02Data: any[] = [];
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=1&limit=2`);
    const json: any = await res.json();
    p02Data = json.data || [];
    assert(
      res.status === 200 &&
      p02Data.length === 2 &&
      json.pagination?.page === 1 &&
      json.pagination?.limit === 2,
      'P02',
      'GET ?page=1&limit=2 lấy 2 bản ghi đầu theo maSV',
      json.pagination
    );
  }

  // P03: GET ?page=2&limit=2 (không trùng P02)
  let p03Data: any[] = [];
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=2&limit=2`);
    const json: any = await res.json();
    p03Data = json.data || [];
    const overlap = p02Data.some((sv1) => p03Data.some((sv2) => sv1.maSV === sv2.maSV));
    assert(
      res.status === 200 &&
      p03Data.length === 2 &&
      !overlap &&
      json.pagination?.page === 2,
      'P03',
      'GET ?page=2&limit=2 lấy 2 bản ghi tiếp theo không trùng P02',
      { p02: p02Data.map(s => s.maSV), p03: p03Data.map(s => s.maSV) }
    );
  }

  // P04: GET ?page=3&limit=2 (trang cuối có thể ít hơn 2)
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=3&limit=2`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      Array.isArray(json.data) &&
      json.data.length >= 1 &&
      json.pagination?.page === 3,
      'P04',
      'GET ?page=3&limit=2 trang cuối',
      json.pagination
    );
  }

  // P05: GET ?page=999&limit=2 -> data=[], totalItems vẫn chính xác
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=999&limit=2`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      json.data.length === 0 &&
      json.pagination?.totalItems >= 5 &&
      json.pagination?.page === 999,
      'P05',
      'GET ?page=999&limit=2 trang vượt tổng số trang trả data=[]',
      json.pagination
    );
  }

  // P06: GET ?page=-1 -> 400
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=-1`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P06', 'GET ?page=-1 báo lỗi 400');
  }

  // P07: GET ?page=0 -> 400
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=0`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P07', 'GET ?page=0 báo lỗi 400');
  }

  // P08: GET ?page=1.5 -> 400
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=1.5`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P08', 'GET ?page=1.5 báo lỗi 400');
  }

  // P09: GET ?limit=abc -> 400
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?limit=abc`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P09', 'GET ?limit=abc báo lỗi 400');
  }

  // P10: GET ?limit=51 -> 400 (vượt quá 50)
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?limit=51`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P10', 'GET ?limit=51 báo lỗi 400');
  }

  // P11: GET ?search=Anh -> chỉ tên phù hợp
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?search=Anh`);
    const json: any = await res.json();
    const allMatch = json.data?.every((sv: any) => sv.hoTen.toLowerCase().includes('anh'));
    assert(
      res.status === 200 &&
      json.data.length >= 1 &&
      allMatch,
      'P11',
      'GET ?search=Anh chỉ trả sinh viên tên chứa Anh',
      json.data?.map((s: any) => s.hoTen)
    );
  }

  // P12: GET ?search=Anh&page=2&limit=2 -> totalItems là tổng kết quả lọc
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?search=Anh&page=2&limit=2`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      json.pagination?.totalItems <= 4, // Kết quả lọc Anh ít hơn tổng toàn bảng
      'P12',
      'GET ?search=Anh&page=2&limit=2 totalItems đếm theo kết quả lọc',
      json.pagination
    );
  }

  // P13: GET ?search=khongco -> data=[], totalItems=0, totalPages=0
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?search=khongco_chac_chan_khong_co_123456`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      json.data.length === 0 &&
      json.pagination?.totalItems === 0 &&
      json.pagination?.totalPages === 0,
      'P13',
      'GET ?search=khongco trả data=[] và totalPages=0',
      json.pagination
    );
  }

  // P14: GET ?search=%20Anh%20 -> Trim thành Anh
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?search=%20Anh%20`);
    const json: any = await res.json();
    assert(
      res.status === 200 &&
      json.data.length >= 1 &&
      json.data.every((sv: any) => sv.hoTen.toLowerCase().includes('anh')),
      'P14',
      'GET ?search=%20Anh%20 tự động trim khoảng trắng',
      json.data?.map((s: any) => s.hoTen)
    );
  }

  // P15: GET ?search=[81 ký tự] -> 400
  {
    const longSearch = 'A'.repeat(81);
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?search=${longSearch}`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'P15', 'GET ?search=[81 ký tự] báo lỗi 400');
  }

  // P16: Phân trang dùng ORDER BY maSV + OFFSET/FETCH
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=1&limit=5`);
    const json: any = await res.json();
    const isSorted = json.data.every((val: any, i: number, arr: any[]) => {
      return i === 0 || arr[i - 1].maSV.localeCompare(val.maSV) <= 0;
    });
    assert(res.status === 200 && isSorted, 'P16', 'Dữ liệu được sắp xếp ổn định theo maSV ASC');
  }

  // P17: Hồi quy CRUD cũ
  {
    const resGetSingle = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`);
    assert(resGetSingle.status === 200, 'P17', 'GET /api/v1/sinh-vien/SV001 vẫn hoạt động bình thường (200)');
  }

  console.log('\n--- PHẦN B: LAB 2 - GLOBAL ERROR HANDLING & BẢO MẬT (E01 - E10) ---');

  // E01: GET ?page=-5 -> 400, success=false, message rõ, data=null
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?page=-5`);
    const json: any = await res.json();
    assert(
      res.status === 400 &&
      json.success === false &&
      json.status === 400 &&
      json.data === null &&
      Boolean(json.message),
      'E01',
      'GET ?page=-5 trả về cấu trúc lỗi chuẩn 400',
      json
    );
  }

  // E02: GET ?limit=abc -> 400 bị validate trước Database
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien?limit=abc`);
    const json: any = await res.json();
    assert(res.status === 400 && json.success === false, 'E02', 'GET ?limit=abc bị chặn 400 trước khi chạm Database');
  }

  // E03: GET /api/v1/sinh-vien/SV999 -> 404 Không tìm thấy sinh viên
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV999`);
    const json: any = await res.json();
    assert(
      res.status === 404 &&
      json.success === false &&
      json.status === 404 &&
      json.data === null,
      'E03',
      'GET /api/v1/sinh-vien/SV999 trả về 404 nhất quán',
      json
    );
  }

  // E04: GET /duong-dan-khong-co -> Fallback 404
  {
    const res = await fetch(`${BASE_URL}/duong-dan-hoan-toan-khong-ton-tai`);
    const json: any = await res.json();
    assert(
      res.status === 404 &&
      json.success === false &&
      json.status === 404,
      'E04',
      'Fallback 404 cho route không tồn tại',
      json
    );
  }

  // E05: Lỗi 500 mô phỏng trong dev -> 500, không lộ SQL / secret
  {
    const res = await fetch(`${BASE_URL}/api/test-error-500`);
    const json: any = await res.json();
    const hasSecretLeak = JSON.stringify(json).includes('admin') || JSON.stringify(json).includes('passwordHash');
    assert(
      res.status === 500 &&
      json.success === false &&
      json.status === 500 &&
      !hasSecretLeak,
      'E05',
      'Lỗi 500 mô phỏng phản hồi 500 an toàn không lộ thông tin nhạy cảm',
      json
    );
  }

  // E06 & E07: Kiểm tra cấu trúc lỗi hệ thống 500
  {
    const res = await fetch(`${BASE_URL}/api/test-error-500`);
    const json: any = await res.json();
    assert(
      res.status === 500 && json.status === 500 && json.data === null,
      'E06-E07',
      'Lỗi 500 có format chuẩn {success, status, message, data:null}',
      json
    );
  }

  // E08: GET /api/auth/profile thiếu token -> 401
  {
    const res = await fetch(`${BASE_URL}/api/auth/profile`);
    const json: any = await res.json();
    assert(res.status === 401 && json.success === false, 'E08', 'GET /api/auth/profile thiếu token bị chặn 401');
  }

  // E09: Student ép DELETE bản ghi -> 403
  {
    const res = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV001`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const json: any = await res.json();
    assert(res.status === 403 && json.success === false, 'E09', 'Student gửi DELETE bị chặn 403 Forbidden');
  }

  // E10: Upload > 2MB / sai file như Chương 07 -> 413 / 400
  {
    const largeBuffer = Buffer.alloc(2.2 * 1024 * 1024, 0);
    const formData = new FormData();
    formData.append('avatar', new Blob([largeBuffer], { type: 'image/jpeg' }), 'large.jpg');

    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert(res.status === 413, 'E10', 'Upload > 2MB trả về 413 Payload Too Large');
  }

  console.log('\n====================================================');
  console.log(`TỔNG KẾT: ${passed} ca PASS, ${failed} ca FAIL.`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ CÁC CA KIỂM THỬ CHƯƠNG 08 ĐÃ VƯỢT QUA XUẤT SẮC! 🎉');
  }
  console.log('====================================================\n');

  if (internalServer) {
    internalServer.close();
  }
  await sequelize.close();

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test script:', err);
  process.exit(1);
});
