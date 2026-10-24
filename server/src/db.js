// SQLite 连接 + 建表（使用 Node 内置 node:sqlite，无需安装 native 依赖）
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'smartshift.db');

try {
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
} catch (e) {
  // 已存在
}

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// 通用事务包装（替代 better-sqlite3 的 db.transaction()）
export function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      throw err;
    }
  };
}

// 初始化 schema
export function initSchema() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

initSchema();

export default db;
