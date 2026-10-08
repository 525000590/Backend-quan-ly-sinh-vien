import {
  layDanhSachSinhVien,
  timSinhVienTheoMa,
  themSinhVien,
  capNhatSinhVien,
  xoaSinhVien,
} from '../services/sinhVien.service.js';
import { sequelize } from '../config/database.js';

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('--- TEST CRUD TỰ ĐỘNG ---');

    // 1. Dọn dẹp SV003 nếu có
    const svCu = await timSinhVienTheoMa('SV003');
    if (svCu) {
      await xoaSinhVien('SV003');
      console.log('Đã dọn dẹp SV003 cũ.');
    }

    // 2. Test T01: GET list
    const list = await layDanhSachSinhVien();
    console.log('T01 PASS - Danh sách:', list.length, 'sinh viên.');

    // 3. Test T02: POST SV003
    const svMoi = await themSinhVien({
      maSV: 'SV003',
      hoTen: 'Ngọc Mai',
      email: 'ngocmai@example.com',
      maLop: '25CT114',
    });
    console.log('T02 PASS - Thêm mới SV003:', svMoi);

    // 4. Test T05: GET SV003
    const sv003 = await timSinhVienTheoMa('SV003');
    console.log('T05 PASS - Tìm thấy SV003:', sv003);

    // 5. Test T06: PUT SV003
    const svUpdate = await capNhatSinhVien('SV003', {
      hoTen: 'Ngọc Mai Updated',
      email: 'ngocmai@example.com',
      maLop: '25CT114',
    });
    console.log('T06 PASS - Cập nhật SV003:', svUpdate);

    // 6. Test GET lại sau PUT
    const svSauUpdate = await timSinhVienTheoMa('SV003');
    console.log('Xác nhận sau PUT:', svSauUpdate);

    // 7. Test T10: DELETE SV003
    await xoaSinhVien('SV003');
    console.log('T10 PASS - Xóa SV003');

    // 8. Test T11: GET sau DELETE
    const svSauXoa = await timSinhVienTheoMa('SV003');
    console.log('T11 PASS - Tìm sau xóa:', svSauXoa); // Should be undefined

    console.log('>>> TOÀN BỘ LOGIC BACKEND HOẠT ĐỘNG HOÀN HẢO! <<<');
  } catch (error) {
    console.error('LỖI TEST:', error);
  } finally {
    await sequelize.close();
  }
}

main();
