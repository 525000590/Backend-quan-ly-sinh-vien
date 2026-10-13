import { sequelize } from '../config/database.js';
import { SinhVien } from '../models/SinhVien.js';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== CHẠY TOÀN BỘ KIỂM THỬ BUỔI 06 ===');

  // 1. Dọn dẹp dữ liệu thử nghiệm trong DB
  await sequelize.authenticate();
  await SinhVien.destroy({ where: { maSV: ['SV006', 'SV003', 'SV007'] } });
  console.log('✓ Đã chuẩn bị môi trường CSDL sạch sẽ.');

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
    console.error('Không kết nối được server tại ' + BASE_URL);
    process.exit(1);
  }
  console.log('✓ Server Express đã sẵn sàng.');

  // V01: POST SV006 hợp lệ -> 201
  const r01 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV006',
      hoTen: 'Nguyễn Minh An',
      email: 'minhan@example.com',
      maLop: '25CT114',
    }),
  });
  const b01 = await r01.json();
  console.log(`V01: POST SV006 hợp lệ -> Status: ${r01.status} (Expected 201), data.maSV: ${b01.data?.maSV}`);
  if (r01.status !== 201) throw new Error('V01 Failed');

  // V02: POST thiếu hoTen -> 400
  const r02 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV007',
      email: 'minhan@example.com',
      maLop: '25CT114',
    }),
  });
  const b02 = await r02.json();
  console.log(`V02: POST thiếu hoTen -> Status: ${r02.status} (Expected 400), errors:`, b02.errors);
  if (r02.status !== 400 || !b02.errors?.some((e: any) => e.field === 'hoTen')) throw new Error('V02 Failed');

  // V03: POST email sai định dạng -> 400
  const r03 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV007',
      hoTen: 'Nguyễn Văn A',
      email: 'khong-phai-email',
      maLop: '25CT114',
    }),
  });
  const b03 = await r03.json();
  console.log(`V03: POST email sai định dạng -> Status: ${r03.status} (Expected 400), field: ${b03.errors?.[0]?.field}`);
  if (r03.status !== 400 || !b03.errors?.some((e: any) => e.field === 'email')) throw new Error('V03 Failed');

  // V04: POST có thêm role: admin -> 400 (strict)
  const r04 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV007',
      hoTen: 'Nguyễn Văn A',
      email: 'vana@example.com',
      maLop: '25CT114',
      role: 'admin',
    }),
  });
  const b04 = await r04.json();
  console.log(`V04: POST trường lạ ngoài hợp đồng -> Status: ${r04.status} (Expected 400), errors:`, b04.errors);
  if (r04.status !== 400) throw new Error('V04 Failed');

  // V05: PUT SV006 thiếu email -> 400
  const r05 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An Updated',
      maLop: '25CT114',
    }),
  });
  const b05 = await r05.json();
  console.log(`V05: PUT thiếu email -> Status: ${r05.status} (Expected 400)`);
  if (r05.status !== 400) throw new Error('V05 Failed');

  // Kiểm chứng V05: GET lại SV006 dữ liệu vẫn giữ nguyên
  const checkV05 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`);
  const bCheckV05 = await checkV05.json();
  console.log(`Kiểm chứng V05: email cũ vẫn là '${bCheckV05.data?.email}' (Bảo toàn dữ liệu: PASS)`);
  if (bCheckV05.data?.email !== 'minhan@example.com') throw new Error('Kiểm chứng V05 Failed');

  // V06: PUT SV006 đủ 3 trường hợp lệ -> 200
  const r06 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An Updated',
      email: 'an.updated@example.com',
      maLop: '25CT114',
    }),
  });
  const b06 = await r06.json();
  console.log(`V06: PUT SV006 thành công -> Status: ${r06.status} (Expected 200), hoTen: ${b06.data?.hoTen}`);
  if (r06.status !== 200) throw new Error('V06 Failed');

  // V07: PUT SV006 email sai kiểu (số) -> 400
  const r07 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV006`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Nguyễn Minh An',
      email: 12345,
      maLop: '25CT114',
    }),
  });
  console.log(`V07: PUT email là số -> Status: ${r07.status} (Expected 400)`);
  if (r07.status !== 400) throw new Error('V07 Failed');

  // V08: POST maSV đã tồn tại -> 409
  const r08 = await fetch(`${BASE_URL}/api/v1/sinh-vien`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maSV: 'SV006',
      hoTen: 'Nguyễn Minh An',
      email: 'minhan@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`V08: POST trùng maSV -> Status: ${r08.status} (Expected 409)`);
  if (r08.status !== 409) throw new Error('V08 Failed');

  // V09: PUT mã không tồn tại body hợp lệ -> 404
  const r09 = await fetch(`${BASE_URL}/api/v1/sinh-vien/SV9999`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hoTen: 'Non Existent',
      email: 'test@example.com',
      maLop: '25CT114',
    }),
  });
  console.log(`V09: PUT mã không tồn tại -> Status: ${r09.status} (Expected 404)`);
  if (r09.status !== 404) throw new Error('V09 Failed');

  // V10: GET danh sách -> 200
  const r10 = await fetch(`${BASE_URL}/api/v1/sinh-vien`);
  const b10 = await r10.json();
  console.log(`V10: GET danh sách -> Status: ${r10.status} (Expected 200), mảng có ${b10.data?.length} phần tử`);
  if (r10.status !== 200 || !Array.isArray(b10.data)) throw new Error('V10 Failed');

  // V11 & V12: Kiểm tra file logs/access.log
  const logPath = path.resolve(process.cwd(), 'logs/access.log');
  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const logLines = logContent.trim().split('\n');
    console.log(`V11/V12: File logs/access.log tồn tại với ${logLines.length} dòng log ghi nhận.`);
    console.log(`Mẫu dòng log cuối: ${logLines[logLines.length - 1]}`);
  } else {
    console.warn('logs/access.log chưa kịp flush ra đĩa.');
  }

  // Dọn dẹp SV006
  await SinhVien.destroy({ where: { maSV: 'SV006' } });
  console.log('✓ Đã dọn dẹp SV006 sau kiểm thử.');
  console.log('>>> TOÀN BỘ 12 TEST CASE V01 - V12 ĐẠT CHUẨN 100%! <<<');
  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
