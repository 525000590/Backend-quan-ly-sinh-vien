import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class SinhVien extends Model<
  InferAttributes<SinhVien>,
  InferCreationAttributes<SinhVien>
> {
  declare maSV: string;
  declare hoTen: string;
  declare email: string;
  declare maLop: string;
}

SinhVien.init(
  {
    maSV: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      allowNull: false,
    },
    hoTen: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(254),
      allowNull: false,
    },
    maLop: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'SinhVien',
    schema: 'dbo',
    timestamps: false,
  }
);
