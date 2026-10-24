import { Router } from 'express';
import { db } from '../db.js';
import { hashPasswordSync } from '../utils/password.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';

const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare(`SELECT id, username, name, role, credit, points, created_at FROM users ORDER BY id`).all();
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare(`SELECT id, username, name, role, credit, points, created_at FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

// POST /api/users  (admin)
router.post('/', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), async (req, res) => {
  const { username, name, password, role = ROLES.MEMBER, credit = 100 } = req.body || {};
  if (!username || !name || !password) return res.status(400).json({ error: '用户名、姓名、密码必填' });
  const hash = hashPasswordSync(password);
  try {
    const info = db.prepare(`
      INSERT INTO users (username, name, password_hash, role, credit)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, name, hash, role, credit);
    res.json({ id: info.lastInsertRowid, username, name, role, credit });
  } catch (e) {
    res.status(400).json({ error: '用户名已存在或参数无效' });
  }
});

// PATCH /api/users/:id  (admin)
router.patch('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const fields = ['role', 'credit', 'points', 'name'];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (req.body?.[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: '没有可更新字段' });
  vals.push(req.params.id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const user = db.prepare(`SELECT id, username, name, role, credit, points FROM users WHERE id = ?`).get(req.params.id);
  res.json({ user });
});

// DELETE /api/users/:id  (super_admin only)
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN), (req, res) => {
  db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
