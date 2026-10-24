import { Router } from 'express';
import { db } from '../db.js';
import { comparePasswordSync } from '../utils/password.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }
  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  if (!user || !comparePasswordSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      credit: user.credit,
      points: user.points,
    },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`SELECT id, username, name, role, credit, points FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

export default router;
