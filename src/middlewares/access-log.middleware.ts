import fs from 'node:fs';
import path from 'node:path';
import morgan from 'morgan';

const logsDir = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, 'access.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

export const accessLogger = morgan('combined', {
  stream: logStream,
});
