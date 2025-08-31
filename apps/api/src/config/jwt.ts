// src/config/jwt.ts
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') }); // 依你的路徑調整

export const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET?.trim();
  if (!s || s.length < 1) throw new Error('Missing/weak JWT_SECRET');
  return s;
})();
export const JWT_SECRET = process.env.JWT_SECRET || '';