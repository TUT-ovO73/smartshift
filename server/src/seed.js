// 种子数据：1 团队 + 6 用户 + 14 天班次 + 可用时间
import { db } from './db.js';
import { hashPasswordSync } from './utils/password.js';
import { ROLES, DEFAULT_TEAM_NAME, DEFAULT_PASSWORD } from './config.js';

console.log('Seeding database...');

// 清空（按外键反向顺序）
db.prepare(`DELETE FROM points_ledger`).run();
db.prepare(`DELETE FROM assignments`).run();
db.prepare(`DELETE FROM availability`).run();
db.prepare(`DELETE FROM shifts`).run();
db.prepare(`DELETE FROM team_members`).run();
db.prepare(`DELETE FROM teams`).run();
db.prepare(`DELETE FROM users`).run();

const hash = hashPasswordSync(DEFAULT_PASSWORD);

// 用户
const users = [
  { username: 'admin', name: '超级管理员', role: ROLES.SUPER_ADMIN, credit: 100 },
  { username: 'manager', name: '排班管理员', role: ROLES.SCHEDULE_ADMIN, credit: 95 },
  { username: 'alice', name: 'Alice', role: ROLES.MEMBER, credit: 90 },
  { username: 'bob', name: 'Bob', role: ROLES.MEMBER, credit: 85 },
  { username: 'carol', name: 'Carol', role: ROLES.MEMBER, credit: 95 },
  { username: 'dave', name: 'Dave', role: ROLES.MEMBER, credit: 80 },
];

const userIdMap = {};
for (const u of users) {
  const info = db.prepare(`
    INSERT INTO users (username, name, password_hash, role, credit)
    VALUES (?, ?, ?, ?, ?)
  `).run(u.username, u.name, hash, u.role, u.credit);
  userIdMap[u.username] = info.lastInsertRowid;
}

// 团队
const teamInfo = db.prepare(`INSERT INTO teams (name, creator_id) VALUES (?, ?)`).run(
  DEFAULT_TEAM_NAME, userIdMap.admin
);
const teamId = teamInfo.lastInsertRowid;

// team_members
for (const u of users) {
  db.prepare(`
    INSERT INTO team_members (team_id, user_id, role_in_team, credit)
    VALUES (?, ?, ?, ?)
  `).run(teamId, userIdMap[u.username], u.role, u.credit);
}

// 14 天班次（从今天起）
function pad(n) { return String(n).padStart(2, '0'); }
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

for (let i = 0; i < 14; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  const dateStr = formatDate(d);
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 早班 06:00-14:00 需 2 人
  db.prepare(`
    INSERT INTO shifts (team_id, title, date, start_time, end_time, duration_min, location_text,
                       required_count, is_special, priority_weight, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(
    teamId,
    `${dateStr} 早班`,
    dateStr, '06:00', '14:00', 8 * 60,
    '一层前台', 2,
    isWeekend ? 1 : 0, isWeekend ? 5 : 0
  );

  // 晚班 14:00-22:00 需 2 人
  db.prepare(`
    INSERT INTO shifts (team_id, title, date, start_time, end_time, duration_min, location_text,
                       required_count, is_special, priority_weight, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).run(
    teamId,
    `${dateStr} 晚班`,
    dateStr, '14:00', '22:00', 8 * 60,
    '一层前台', 2,
    isWeekend ? 1 : 0, isWeekend ? 5 : 0
  );
}

// 每个成员未来 7 天各有 1-2 个不可用时段
const memberIds = ['alice', 'bob', 'carol', 'dave'];
const slotPool = ['00:00-06:00', '06:00-08:00', '08:00-10:00', '10:00-12:00',
                  '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-22:00', '22:00-24:00'];
const prefs = ['morning', 'evening', 'night', 'any'];

for (let i = 0; i < 7; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  const dateStr = formatDate(d);

  for (const m of memberIds) {
    const userId = userIdMap[m];
    // 随机 1-2 个不可用时段
    const count = (i + m.length) % 2 === 0 ? 2 : 1;
    const unavail = [];
    const poolCopy = [...slotPool];
    for (let k = 0; k < count && poolCopy.length; k++) {
      const idx = (i + k + m.length) % poolCopy.length;
      unavail.push(poolCopy.splice(idx, 1)[0]);
    }
    const pref = prefs[(i + m.length) % prefs.length];
    db.prepare(`
      INSERT INTO availability (user_id, date, unavailable_slots, preferred_shift_type)
      VALUES (?, ?, ?, ?)
    `).run(userId, dateStr, JSON.stringify(unavail), pref);
  }
}

console.log(`Seed done: ${users.length} users, 1 team, 28 shifts, ${7 * memberIds.length} availability records.`);
console.log(`Default accounts: ${users.map(u => `${u.username}/123456`).join(', ')}`);
