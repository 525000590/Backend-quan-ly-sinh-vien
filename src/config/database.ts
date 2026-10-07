// Polyfill Promise.withResolvers cho các phiên bản Node.js < 22 (như Node.js 20 LTS)
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import 'dotenv/config';
import { Sequelize } from 'sequelize';

// 1. Đọc và kiểm tra các biến môi trường cần thiết
const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_ENCRYPT,
  DB_TRUST_CERT,
} = process.env;

const requiredEnvVars: string[] = [];
if (!DB_HOST) requiredEnvVars.push('DB_HOST');
if (!DB_NAME) requiredEnvVars.push('DB_NAME');
if (!DB_USER) requiredEnvVars.push('DB_USER');
if (!DB_PASSWORD) requiredEnvVars.push('DB_PASSWORD');

if (requiredEnvVars.length > 0) {
  throw new Error(
    `[Database Config Error] Thiếu các biến môi trường cấu hình database: ${requiredEnvVars.join(', ')}`
  );
}

// 2. Chuyển đổi và kiểm tra DB_PORT hợp lệ (1..65535)
const parsedPort = Number(DB_PORT ?? 1433);
if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error(
    `[Database Config Error] DB_PORT không hợp lệ (${DB_PORT}). Cần là số nguyên từ 1 đến 65535.`
  );
}

// 3. Khởi tạo instance Sequelize dùng chung
export const sequelize = new Sequelize(
  DB_NAME as string,
  DB_USER as string,
  DB_PASSWORD as string,
  {
    host: DB_HOST,
    port: parsedPort,
    dialect: 'mssql',
    logging: console.log,
    dialectOptions: {
      options: {
        encrypt: DB_ENCRYPT !== 'false',
        trustServerCertificate: DB_TRUST_CERT === 'true',
        cryptoCredentialsDetails: {
          minVersion: 'TLSv1',
          ciphers: 'DEFAULT@SECLEVEL=0',
        },
      },
    },
  }
);
