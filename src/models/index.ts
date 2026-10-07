import { SinhVien } from './SinhVien.js';
import { Lop } from './Lop.js';
import { sequelize } from '../config/database.js';

// Thiết lập quan hệ 1-N: Một Lớp có nhiều Sinh Viên
Lop.hasMany(SinhVien, { foreignKey: 'maLop', as: 'sinhViens' });
SinhVien.belongsTo(Lop, { foreignKey: 'maLop', as: 'lop' });

export { SinhVien, Lop, sequelize };
